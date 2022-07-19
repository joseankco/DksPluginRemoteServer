import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RankService {

  URL = 'https://darkorbit-22.bpsecure.com/do_img/global/ranks/rank_';

  constructor() { }

  public getRankUrl(img: string) {
    return this.URL + img;
  }
}
