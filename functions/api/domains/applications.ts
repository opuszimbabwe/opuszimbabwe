import {localApplication} from '../../_lib/local-domains';
import {origin,failure} from '../../_lib/http';
import type {PagesHandler} from '../../_lib/types';
export const onRequestPost:PagesHandler=async c=>{try{origin(c.request);return await localApplication(c)}catch(e){return failure(e)}};
