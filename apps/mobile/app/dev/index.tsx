// /dev gallery entry — thin route file that mounts DevGallery.
// All logic lives in src/dev/ so this route stays tiny.

import { DevGallery } from '../../src/dev/DevGallery';

export default function DevRoute() {
  return <DevGallery />;
}
