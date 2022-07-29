import { Pipe, PipeTransform } from '@angular/core';
import {replaceAll} from "../utils/utils";
import {ShipModule} from "../models/ship-module.model";

@Pipe({
  name: 'urlShip'
})
export class UrlShipPipe implements PipeTransform {
  url = 'https://darkorbit-22.bpsecure.com/do_img/global/items/';
  url2 = 'https://darkorbit-22.bpsecure.com/do_img/global/header/ships/model';
  transform(value: unknown, ...args: unknown[]): unknown {
    let arg = '_100x100.png';
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
    return this.url + replaceAll(desc, '_', '/') + append + arg;
  }
}
