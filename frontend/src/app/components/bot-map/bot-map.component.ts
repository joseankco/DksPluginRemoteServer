import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {DarkBotService} from "../../services/dark-bot.service";
import {Barrier, BotMap} from "../../models/bot-map.model";
import {ServerResponse} from "../../models/main.model";
import {MinimapService} from "../../services/minimap.service";
import {Booster} from "../../models/hero.model";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-bot-map',
  templateUrl: './bot-map.component.html',
  styleUrls: ['./bot-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BotMapComponent implements OnInit, OnChanges {

  shipRatioSize = 300;
  npcRatioSize = 170;
  portalRatioSize = 100;
  playerRatioSize = 200;
  initialized: boolean = false;
  background: string = '';

  colors = {
    portals: '#767676',
    allies: '#1dd7ee',
    enemies: '#ff1818',
    npcs: '#c90d0d',
    hero: '#48ed00',
    movement: '#8ebaff',
    pet: {
      inner: '#ff7100',
      outter: '#4b53ff'
    }
  }

  @ViewChild('map', {static: true}) map!: ElementRef<HTMLCanvasElement>;
  @Input() data!: ServerResponse;

  constructor(
    private minimap: MinimapService,
    public darkbot: DarkBotService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    this.initMap();
    this.renderMap();
  }

  ngOnInit(): void {
    this.initMap();
    this.renderMap();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.initMap();
    this.renderMap();
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(event: Event) {
    this.initMap();
    this.renderMap();
  }

  private initMap() {
    if (this.map && this.data) {
      const canvas = this.map.nativeElement;
      canvas.style.width = '100%';
      canvas.style.height ='auto';
      canvas.width = this.data.map.boundX / 10;
      canvas.height =  this.data.map.boundY / 10;
    }
  }

  private transformX(x: number) {
    const w = this.map.nativeElement.width;
    return ((x / this.data.map.boundX) * w)
  }

  private transformY(y: number) {
    const h = this.map.nativeElement.height;
    return ((y / this.data.map.boundY) * h)
  }

  private drawPoint(x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: any, ratioSize: number) {
    const size = ((canvas.width + canvas.height) / ratioSize)
    ctx.fillStyle = color;
    ctx.fillRect(this.transformX(x), this.transformY(y), size, size);
  }

  private getCircle(x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: any, ratioSize: number) {
    const size = ((canvas.width + canvas.height) / ratioSize)
    ctx.beginPath();
    ctx.arc(this.transformX(x), this.transformY(y), size, 0, 2 * Math.PI);
    return ctx;
  }

  private drawCircle(x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: any, ratioSize: number) {
    const size = ((canvas.width + canvas.height) / ratioSize)
    ctx.lineWidth = 8;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(this.transformX(x), this.transformY(y), size, 0, 2 * Math.PI);
    ctx.stroke();
  }

  private drawCircleFill(x: number, y: number, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, color: any, ratioSize: number) {
    const size = ((canvas.width + canvas.height) / ratioSize)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(this.transformX(x), this.transformY(y), size, 0, 2 * Math.PI);
    ctx.fill();
  }

  private clearMap(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  private drawBarrier(barrier: Barrier, context: CanvasRenderingContext2D) {
    context.fillStyle = 'rgba(225, 225, 225, 0.3)';
    context.fillRect(this.transformX(barrier.x1), this.transformY(barrier.y1),this.transformX(barrier.x2) - this.transformX(barrier.x1),this.transformY(barrier.y2) - this.transformY(barrier.y1));
  }

  private renderMap() {
    if (this.map) {
      const canvas = this.map.nativeElement;
      const context = canvas.getContext('2d');
      this.clearMap(canvas)
      if (context) {
        this.background = this.minimap.getMinimapUrl(this.data.map.mapID);
        this.data.map.portals.forEach((portal) => {
          this.drawCircle(portal.x, portal.y, context, canvas, this.colors.portals, this.portalRatioSize);
        });
        this.data.map.npcs.forEach((npc) => {
          this.drawPoint(npc.x, npc.y, context, canvas, this.colors.npcs, this.npcRatioSize);
        });
        this.data.map.players.forEach((player) => {
          this.drawCircleFill(player.x, player.y, context, canvas, player.isEnemy ? this.colors.enemies : this.colors.allies, this.shipRatioSize);
        });
        this.data.map.barriers.forEach((barrier) => {
          this.drawBarrier(barrier, context);
        });
        if (this.data.hero.destination.hasDestination) {
          this.drawCircleFill(this.data.hero.destination.x, this.data.hero.destination.y, context, canvas, this.colors.movement, this.shipRatioSize * 1.5);
          context.beginPath();
          context.moveTo(this.transformX(this.data.hero.x), this.transformY(this.data.hero.y));
          context.lineTo(this.transformX(this.data.hero.destination.x), this.transformY(this.data.hero.destination.y));
          context.lineWidth = ((canvas.width + canvas.height) / (this.shipRatioSize * 2));
          context.strokeStyle = this.colors.movement;
          context.stroke();
        }
        this.drawCircleFill(this.data.hero.x, this.data.hero.y, context, canvas, this.colors.hero, this.playerRatioSize);
        if (this.data.hero.pet.isActive) {
          this.drawCircleFill(this.data.hero.pet.x, this.data.hero.pet.y, context, canvas, this.colors.pet.outter, this.playerRatioSize * 1.2);
          this.drawCircleFill(this.data.hero.pet.x, this.data.hero.pet.y, context, canvas, this.colors.pet.inner, this.playerRatioSize * 1.8);
        }
      }
    }
  }

  getTargetColor() {
    return this.data.hero.target.isEnemy ? this.colors.enemies : this.colors.allies;
  }

  getSelectedMap() {
    return this.data.config.mapOptions.find(m => m.value === this.data.config.selectedMapId)?.name;
  }
}
