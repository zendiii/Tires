/*
 * ATD / Tirewire credential probe.
 *
 * WHAT THIS ANSWERS
 *   1. Are your credentials for the Tirewire Connections Center API?
 *   2. Is American Tire Distributors one of your supplier connections, and
 *      what is its ConnectionID? (every product and order call needs it)
 *   3. Does a real tire search come back with pricing and stock?
 *
 * RUN IT
 *   ATD_ACCESS_KEY=... ATD_GROUP_TOKEN=... node scripts/atd-check.mjs
 *
 * Credentials are read from the environment and never written anywhere.
 * Do not paste them into a file that gets committed — see .env.example.
 *
 * This is a read-only diagnostic: it calls ValidateGroupToken,
 * GetConnectionsByGroup, and GetTires. It never places an order.
 */

const BASE = 'https://ws.tirewire.com/connectionscenter'

const ACCESS_KEY = process.env.ATD_ACCESS_KEY
const GROUP_TOKEN = process.env.ATD_GROUP_TOKEN
/** Optional: a size to test the catalog with. */
const TEST_SIZE = process.env.ATD_TEST_SIZE || '275/55R20'

if (!ACCESS_KEY || !GROUP_TOKEN) {
  console.error(
    'Missing credentials.\n\n' +
      '  ATD_ACCESS_KEY=your-key ATD_GROUP_TOKEN=your-token node scripts/atd-check.mjs\n',
  )
  process.exit(1)
}

/** Escapes text destined for an XML text node. */
function xml(value) {
  return String(value).replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  )
}

/**
 * Issues one SOAP 1.1 call.
 * @param service - 'commonservice' | 'productsservice' | 'ordersservice'
 * @param action - operation name, which is also the SOAPAction suffix
 * @param body - inner XML for the operation element
 */
async function soap(service, action, body) {
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
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `${ns}/${action}`,
    },
    body: envelope,
  })

  const text = await response.text()
  if (!response.ok) {
    const fault = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    throw new Error(`${action} failed (HTTP ${response.status}): ${fault ? fault[1] : text.slice(0, 300)}`)
  }
  return text
}

/** Pulls repeated <tag>value</tag> occurrences out of a response. */
function pluck(xmlText, tag) {
  return [...xmlText.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'g'))].map((m) => m[1])
}

const ok = (m) => console.log(`  ✓ ${m}`)
const bad = (m) => console.log(`  ✗ ${m}`)

async function main() {
  console.log('\nProbing Tirewire Connections Center\n' + '-'.repeat(46))

  // 1. Do these credentials belong to this API at all?
  console.log('\n[1] Validating group token')
  const validation = await soap(
    'commonservice',
    'ValidateGroupToken',
    `<groupToken>${xml(GROUP_TOKEN)}</groupToken>`,
  )
  const valid = /<ValidateGroupTokenResult>\s*true\s*<\/ValidateGroupTokenResult>/i.test(validation)
  if (valid) {
    ok('Group token accepted — these are Tirewire Connections Center credentials.')
  } else {
    bad('Group token rejected. Your credentials are probably for a different')
    console.log('    integration route (direct ATD feed, EDI, or a sync platform).')
    console.log('    Response:', validation.slice(0, 400))
    return
  }

  // 2. Which suppliers are wired to this account, and is ATD among them?
  console.log('\n[2] Listing supplier connections')
  const connections = await soap(
    'commonservice',
    'GetConnectionsByGroup',
    `<key>${xml(ACCESS_KEY)}</key><groupToken>${xml(GROUP_TOKEN)}</groupToken>`,
  )
  const names = pluck(connections, 'Name')
  const ids = pluck(connections, 'ID')
  if (names.length === 0) {
    bad('No connections returned — your group has no suppliers attached yet.')
    console.log('    Ask ATD/Tirewire to attach your ATD account to this group.')
  } else {
    ok(`${names.length} connection(s) found:`)
    names.forEach((n, i) => console.log(`      ConnectionID ${ids[i] ?? '?'} — ${n}`))
    const atd = names.findIndex((n) => /american tire|\batd\b/i.test(n))
    console.log(
      atd >= 0
        ? `\n  ✓ ATD is connected (ConnectionID ${ids[atd] ?? '?'}). Use that id in config.`
        : '\n  ! No connection obviously named ATD — confirm which of the above is your ATD account.',
    )
  }

  // 3. Does the catalog actually return priced, in-stock product?
  console.log(`\n[3] Test tire search for ${TEST_SIZE}`)
  const tires = await soap(
    'productsservice',
    'GetTires',
    '<options>' +
      `<AccessKey>${xml(ACCESS_KEY)}</AccessKey>` +
      `<GroupToken>${xml(GROUP_TOKEN)}</GroupToken>` +
      `<TireSize>${xml(TEST_SIZE)}</TireSize>` +
      '<DetailLevel>1</DetailLevel>' +
      '</options>',
  )
  const count = (tires.match(/<Tire>/g) || []).length
  if (count > 0) {
    ok(`${count} tire(s) returned. Catalog access works.`)
    const sample = tires.match(/<Tire>[\s\S]*?<\/Tire>/)
    if (sample) {
      const fields = [...sample[0].matchAll(/<([A-Za-z]+)>([^<]{1,40})<\/\1>/g)].slice(0, 14)
      console.log('\n  Sample record fields (these drive the Tire type mapping):')
      fields.forEach(([, k, v]) => console.log(`      ${k}: ${v}`))
    }
  } else {
    bad(`No tires returned for ${TEST_SIZE}.`)
    console.log('    Either the size is not stocked, or the connection needs')
    console.log('    a ConnectionID passed explicitly. Try ATD_TEST_SIZE=225/65R17.')
  }

  console.log('\nDone.\n')
}

main().catch((error) => {
  console.error('\nProbe failed:', error.message, '\n')
  process.exit(1)
})
