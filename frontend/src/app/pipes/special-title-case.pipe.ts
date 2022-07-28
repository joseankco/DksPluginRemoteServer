import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'specialTitleCase'
})
export class SpecialTitleCasePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    let str = value as string;
    return str.replace(/(\b)([a-z\WA-Z\W])/g,(firstLetter) => {
      return firstLetter.toUpperCase();
    });
  }
}
