/**
 * Common shape for a syncable QuickBooks object. Each module (customer, invoice,
 * …) implements this; the registry in ./index.ts drives buildWorkQueue (pull/push
 * request generation) and dispatches responses back to the owning parser.
 */
import { Env } from '../../db';

export interface QbObject {
  /** Display/type name, e.g. 'Customer'. */
  name: string;
  /**
   * requestID stamped on this object's qbXML *Rq elements and echoed back on the
   * *Rs response — used to route receiveResponseXML to parseResponse(). Keep it
   * lowercase and unique per object; Add/Mod flows may append a local id.
   */
  requestID: string;
  /**
   * Build the qbXML *Rq fragment(s) for this object this session (a Query for a
   * pull, and/or Add/Mod for pending local changes). Return '' to skip.
   */
  buildRequest(env: Env): Promise<string>;
  /** Parse a *Rs response fragment and persist it (upsert staging + qbwc_map). */
  parseResponse(env: Env, responseXml: string): Promise<void>;
}
