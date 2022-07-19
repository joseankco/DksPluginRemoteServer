import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tickAsTime'
})
export class TickAsTimePipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return new Date(value as number).toLocaleTimeString();
  }

}
