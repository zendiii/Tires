/*
 * ATD tire supply, via the Tirewire Connections Center SOAP API.
 *
 * SERVER-ONLY. Holds credentials; never import from src/.
 *
 * Contract verified against the public WSDLs at
 * https://ws.tirewire.com/connectionscenter/productsservice.asmx?WSDL
 *
 * Credentials come from Vercel environment variables — never `VITE_`-prefixed,
 * since Vite inlines those into the public bundle.
 */
import { applyMarkup, toCents } from './pricing'

const BASE = 'https://ws.tirewire.com/connectionscenter'

const ACCESS_KEY = process.env.ATD_ACCESS_KEY ?? ''
const GROUP_TOKEN = process.env.ATD_GROUP_TOKEN ?? ''
const CONNECTION_ID = process.env.ATD_CONNECTION_ID ?? ''

export const ATD_CONFIGURED = Boolean(ACCESS_KEY && GROUP_TOKEN && CONNECTION_ID)

/**
 * The shape sent to the browser.
 *
 * Note what is absent: ATD's `BuyPrice`. Cost and margin stop at this boundary.
 */
export interface PublicTire {
  id: string
  brand: string
  model: string
  size: string
  /** Customer price per tire, in cents, markup already applied. */
  price: number
  /** Federal excise tax per tire, in cents. Passed through at cost. */
  fet: number
  inStock: boolean
  /** Units on hand. Clamped so exact stock levels aren't broadcast. */
  availability: 'in-stock' | 'low' | 'out'
  loadRange: string
  speedRating: string
  warranty: string
  utqg: string
  imageUrl: string
  /** ATD product code — needed later to place an order. */
  productCode: string
}

function xmlEscape(value: string): string {
  return value.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!,
  )
}

function xmlUnescape(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

/**
 * Reads a flat scalar child out of one <Tire> block.
 *
 * The fields we consume are all flat scalars, so this stays deliberately small
 * rather than pulling in an XML parser. If nested structures are ever needed
 * (QuantityDetails, Programs), swap this for a real parser — regex is not a
 * general XML solution.
 */
function field(block: string, name: string): string {
  const match = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))
  return match ? xmlUnescape(match[1].trim()) : ''
}

async function soap(service: string, action: string, body: string): Promise<string> {
  const ns = `${BASE}/${service}`
  const envelope =
    '<?xml version="1.0" encoding="utf-8"?>' +
    '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"' +
    ' xmlns:xsd="http://www.w3.org/2001/XMLSchema"' +
    ' xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' +
    `<soap:Body><${action} xmlns="${ns}">${body}</${action}></soap:Body>` +
    '</soap:Envelope>'

  const response = await fetch(`${BASE}/${service}.asmx`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: `${ns}/${action}` },
    body: envelope,
    signal: AbortSignal.timeout(15_000),
  })

  const text = await response.text()
  if (!response.ok) {
    const fault = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    throw new Error(`ATD ${action} failed (${response.status}): ${fault ? fault[1] : 'unknown'}`)
  }
  return text
}

/** Hides exact counts — competitors shouldn't be able to read your stock. */
function availabilityOf(quantity: number): PublicTire['availability'] {
  if (quantity <= 0) return 'out'
  if (quantity <= 4) return 'low'
  return 'in-stock'
}

/**
 * Searches ATD for a tire size, e.g. "275/55R20".
 *
 * `ApplyTirewireMarkups` is deliberately false: we want raw dealer cost so our
 * own markup ladder is the single source of pricing truth. Letting Tirewire
 * mark up too would stack two invisible margins.
 */
export async function searchBySize(size: string): Promise<PublicTire[]> {
  if (!ATD_CONFIGURED) throw new Error('ATD credentials are not configured')

  const xml = await soap(
    'productsservice',
    'GetTires',
    '<options>' +
      `<AccessKey>${xmlEscape(ACCESS_KEY)}</AccessKey>` +
      `<GroupToken>${xmlEscape(GROUP_TOKEN)}</GroupToken>` +
      `<ConnectionID>${xmlEscape(CONNECTION_ID)}</ConnectionID>` +
      `<TireSize>${xmlEscape(size)}</TireSize>` +
      '<DetailLevel>2</DetailLevel>' +
      '<ApplyTirewireMarkups>false</ApplyTirewireMarkups>' +
      '</options>',
  )

  const blocks = xml.match(/<Tire>[\s\S]*?<\/Tire>/g) ?? []

  return blocks
    .map((block): PublicTire => {
      const cost = toCents(field(block, 'BuyPrice'))
      const { price, fet } = applyMarkup(cost, toCents(field(block, 'Tax')))
      const quantity = Number.parseInt(field(block, 'Quantity'), 10) || 0

      return {
        id: field(block, 'ID'),
        brand: field(block, 'Make'),
        model: field(block, 'Pattern') || field(block, 'Name'),
        size,
        price,
        fet,
        inStock: quantity > 0,
        availability: availabilityOf(quantity),
        loadRange: field(block, 'LoadRange'),
        speedRating: field(block, 'SpeedRating'),
        warranty: field(block, 'Warranty'),
        utqg: field(block, 'UTQG'),
        imageUrl: field(block, 'ImageURL'),
        productCode: field(block, 'ProductCode'),
      }
    })
    // A tire with no usable cost would otherwise be published at $0.
    .filter((tire) => tire.price > 0)
}
