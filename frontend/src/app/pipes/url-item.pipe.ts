import { Pipe, PipeTransform } from '@angular/core';
import {replaceAll} from "../utils/utils";

@Pipe({
  name: 'urlItem'
})
export class UrlItemPipe implements PipeTransform {
  url = 'https://darkorbit-22.bpsecure.com/do_img/global/items/';
  transform(value: unknown, ...args: unknown[]): unknown {
    let desc = value as string;
    let append = '';
    if (desc.startsWith('ship_') &&
      (desc.endsWith('aegis') ||
      desc.endsWith('citadel') ||
      desc.endsWith('spearhead') ||
      desc.startsWith('ship_a-') ||
      desc.startsWith('ship_c-') ||
      desc.startsWith('ship_s-'))
    ) {
      append = '-eic'
    }
    return this.url + replaceAll(desc, '_', '/') + append + '_30x30.png'
  }
}
