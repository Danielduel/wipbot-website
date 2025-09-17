import { Err, Ok, Result } from "jsr:@dduel/optionals@2.1.1";

export const errP = Promise.resolve(Err(Error()));

export { Err, Ok, Result };
