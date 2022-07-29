import { Pipe, PipeTransform } from '@angular/core';
import {replaceAll} from "../utils/utils";

@Pipe({
  name: 'urlItem'
})
export class UrlItemPipe implements PipeTransform {
  url = 'https://darkorbit-22.bpsecure.com/do_img/global/items/';
  transform(value: unknown, ...args: unknown[]): unknown {
    let desc = value as string;
    if (desc.includes('isochronate')) {
      desc = desc.replace('collectable', 'blueprint');
    }
    let arg0 = desc.includes('blueprint') ? 30 : args[0];
    let arg = arg0 ? '_' + arg0 + 'x' + arg0 + '.png' : '_100x100.png';
    return this.url + replaceAll(desc, '_', '/') + arg;
  }
}
