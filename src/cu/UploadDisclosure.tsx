import {
  DUE_DILIGENCE_PACKET_HREF,
  UPLOAD_DISCLOSURE_LEAD,
  UPLOAD_DISCLOSURE_LINK,
  UPLOAD_DISCLOSURE_TAIL,
} from '@/cu/copy';

/** Anthropic one-liner. The packet link is the only place this sentence sends the reader. */
export function UploadDisclosure() {
  return (
    <>
      {UPLOAD_DISCLOSURE_LEAD}
      <a
        href={DUE_DILIGENCE_PACKET_HREF}
        className="font-semibold underline decoration-1 underline-offset-4 cu-linkline cu-ring"
      >
        {UPLOAD_DISCLOSURE_LINK}
      </a>
      {UPLOAD_DISCLOSURE_TAIL}
    </>
  );
}
