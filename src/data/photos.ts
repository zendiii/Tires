/*
 * Real job photos used across the site.
 *
 * Files here are the optimized output of scripts/optimize-photos.mjs — the
 * multi-megabyte originals live in src/assets/Cameo/ and stay out of git.
 *
 * `position` is a CSS object-position. These are tall phone photos shown in a
 * wide band, so object-cover crops them hard; the value pulls the framing to
 * where the vehicle actually sits in each shot.
 */
import vanBranding from '../assets/photos/van-branding.jpg'
import lamborghiniUrus from '../assets/photos/lamborghini-urus.jpg'
import porscheGt3 from '../assets/photos/porsche-gt3.jpg'
import bmwM5 from '../assets/photos/bmw-m5.jpg'
import vanBmwM3 from '../assets/photos/van-bmw-m3.jpg'
import kiaService from '../assets/photos/kia-service.jpg'
import mountingWheel from '../assets/photos/mounting-wheel.jpg'
import vanLoaded from '../assets/photos/van-loaded.jpg'

export interface Photo {
  src: string
  /** Describes the work shown; used where the photo is content, not decoration. */
  alt: string
  position: string
}

export const HERO_PHOTOS: Photo[] = [
  {
    src: vanBranding,
    alt: "Close-up of the Dino's Mobile Tire Repair van graphics",
    position: 'center 55%',
  },
  {
    src: lamborghiniUrus,
    alt: 'Lamborghini Urus raised on a jack with a wheel removed, service van alongside',
    position: 'center 53%',
  },
  {
    src: porscheGt3,
    alt: 'Porsche 911 GT3 on a jack during a driveway tire service',
    position: 'center 52%',
  },
  {
    src: vanBmwM3,
    alt: "Dino's van parked beside a blue BMW M3 for a tire change",
    position: 'center 48%',
  },
  {
    src: bmwM5,
    alt: 'BMW M5 Touring on a paver driveway after a wheel and tire fitment',
    position: 'center 48%',
  },
  {
    src: kiaService,
    alt: 'Sedan raised on jack stands with wheels removed, service van alongside',
    position: 'center 45%',
  },
  {
    src: mountingWheel,
    alt: 'Technician mounting a wheel on the balancer inside the service van',
    position: 'center 40%',
  },
  {
    src: vanLoaded,
    alt: 'Service van loaded with tires at a job site',
    position: 'center 50%',
  },
]
