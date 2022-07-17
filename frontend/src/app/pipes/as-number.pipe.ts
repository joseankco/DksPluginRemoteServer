import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'asNumber'
})
export class AsNumberPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    const data = Number(value)
    return data.toLocaleString();
  }

}
