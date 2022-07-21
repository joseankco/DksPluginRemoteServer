import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'millisecondsAsDHM'
})
export class MillisecondsAsDHMPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    const ms = Number(value);
    if (ms > 0) {
      const days = Math.floor(ms / (24 * 60 * 60 * 1000));
      const daysms = ms % (24 * 60 * 60 * 1000);
      const hours = Math.floor(daysms / (60 * 60 * 1000));
      const hoursms = ms % (60 * 60 * 1000);
      const minutes = Math.floor(hoursms / (60 * 1000));
      const minutesms = ms % (60 * 1000);
      const sec = Math.floor(minutesms / 1000);
      if (days > 0) {
        return days + 'd ' + hours + 'h';
      } else if (hours > 0) {
        return hours + 'h ' + minutes + 'm';
      } else if (minutes > 0) {
        return minutes + 'm'
      } else {
        return sec + 's';
      }
    }
    return '∞';
  }

}
