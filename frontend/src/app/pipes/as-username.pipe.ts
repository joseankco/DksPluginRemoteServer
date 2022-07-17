import { Pipe, PipeTransform } from '@angular/core';
import {ServerResponse} from "../models/main.model";

@Pipe({
  name: 'asUsername'
})
export class AsUsernamePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    const data = value as ServerResponse;
    if (!data.hashed) {
      return data.hero.username;
    }
    const add = (s: string) => s.split('').reduce((a, c) => a + (isNaN(+c) ? 0 : +c), 0);
    return 'Hashed#' + add(data.hero.username);
  }

}
