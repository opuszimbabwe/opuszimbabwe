"""Reject repository deployment uploads that replace the pinned checkout/backend."""
import email.parser,email.policy,hashlib,json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[2]
def verify_upload(body,content_type,lock=None):
 lock=lock or json.loads((ROOT/'ops/activation/opus-pay-lock.json').read_text())
 message=email.parser.BytesParser(policy=email.policy.default).parsebytes(('Content-Type: '+content_type+'\r\nMIME-Version: 1.0\r\n\r\n').encode()+body)
 parts={p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in message.iter_parts()}
 manifest=json.loads(parts.get('manifest',b'{}'))
 assert all(manifest.get(k)==v for k,v in lock['assets'].items()),'Opus Pay is locked: checkout assets changed or missing'
 assert hashlib.sha256(parts.get('_worker.bundle',b'')).hexdigest()==lock['backend_bundle_sha256'],'Opus Pay backend is locked: review and refresh lock before deploying changed backend'
 return True
