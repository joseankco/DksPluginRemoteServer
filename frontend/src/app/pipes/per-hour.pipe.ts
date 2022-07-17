import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'perHour'
})
export class PerHourPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    const running = Number(args[0]) / 3600;
    return (Math.round(Number(value) / running) as number).toLocaleString();
  }

}
