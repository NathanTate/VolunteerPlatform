import {
  Component, input, output, signal, OnDestroy,
  AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject, NgZone
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

export interface LatLng { lat: number; lng: number; }

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, MatProgressSpinnerModule],
  template: `
    <div class="picker-wrap">
      <div class="map-host" #mapHost></div>
      <div class="map-hint">
        <mat-icon class="hint-icon">touch_app</mat-icon>
        <span>Натисніть на карту або перетягніть маркер</span>
      </div>
      <div class="coords-bar">
        <span class="coord-item">
          <mat-icon class="coord-icon">north</mat-icon>
          {{ currentLat() | number:'1.4-4' }}
        </span>
        <span class="coord-item">
          <mat-icon class="coord-icon">east</mat-icon>
          {{ currentLng() | number:'1.4-4' }}
        </span>
        @if (geocoding()) {
          <mat-spinner diameter="16" class="geo-spinner"></mat-spinner>
        }
        <button mat-icon-button class="locate-btn" (click)="locateMe()"
          matTooltip="Моє місцезнаходження">
          <mat-icon>my_location</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .picker-wrap {
      display: flex; flex-direction: column; gap: 0;
      border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; overflow: hidden;
    }
    .map-host { width: 100%; height: 260px; }
    .map-hint {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; background: #f3f6fb;
      font-size: 12px; color: #546e7a;
      border-top: 1px solid rgba(0,0,0,0.06);
    }
    .hint-icon { font-size: 15px; width: 15px; height: 15px; color: #90a4ae; }
    .coords-bar {
      display: flex; align-items: center; gap: 16px;
      padding: 4px 12px; background: #fff;
      border-top: 1px solid rgba(0,0,0,0.06);
      font-size: 12px; color: #424242;
    }
    .coord-item { display: flex; align-items: center; gap: 3px; }
    .coord-icon { font-size: 14px; width: 14px; height: 14px; color: #9e9e9e; }
    .locate-btn { margin-left: auto; color: #1565c0; width: 32px; height: 32px; }
    .geo-spinner { margin-left: auto; }
  `]
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  lat = input<number>(49.84);
  lng = input<number>(24.03);

  locationChange = output<LatLng>();
  /** Emitted after reverse-geocoding resolves; parent can patch the address field. */
  addressChange  = output<string>();

  @ViewChild('mapHost', { static: true }) mapHost!: ElementRef<HTMLDivElement>;

  currentLat = signal(49.84);
  currentLng = signal(24.03);
  geocoding  = signal(false);

  private map: any       = null;
  private marker: any    = null;
  private mapboxgl: any  = null;
  private platformId     = inject(PLATFORM_ID);
  private zone           = inject(NgZone);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.currentLat.set(this.lat());
    this.currentLng.set(this.lng());
    this.initMap();
  }

  /** Call after the host element becomes visible (e.g. edit panel opened). */
  resize() {
    if (this.map) this.zone.runOutsideAngular(() => {
      requestAnimationFrame(() => this.map.resize());
    });
  }

  private initMap() {
    import('mapbox-gl').then(({ default: mbgl }) => {
      this.mapboxgl = mbgl;
      mbgl.accessToken = environment.mapboxToken;

      this.zone.runOutsideAngular(() => {
        this.map = new mbgl.Map({
          container: this.mapHost.nativeElement,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [this.currentLng(), this.currentLat()],
          zoom: 12,
          attributionControl: false
        });

        // Ensure canvas dimensions are correct as soon as tiles load
        this.map.on('load', () => {
          requestAnimationFrame(() => this.map.resize());
        });

        this.map.addControl(new mbgl.NavigationControl({ showCompass: false }), 'top-right');

        this.marker = new mbgl.Marker({ color: '#1565c0', draggable: true })
          .setLngLat([this.currentLng(), this.currentLat()])
          .addTo(this.map);

        this.marker.on('dragend', () => {
          const pos = this.marker.getLngLat();
          this.zone.run(() => {
            this.updateCoords(pos.lat, pos.lng);
            this.reverseGeocode(pos.lat, pos.lng);
          });
        });

        this.map.on('click', (e: any) => {
          const { lat, lng } = e.lngLat;
          this.marker.setLngLat([lng, lat]);
          this.zone.run(() => {
            this.updateCoords(lat, lng);
            this.reverseGeocode(lat, lng);
          });
        });
      });
    });
  }

  private updateCoords(lat: number, lng: number) {
    this.currentLat.set(lat);
    this.currentLng.set(lng);
    this.locationChange.emit({ lat, lng });
  }

  private reverseGeocode(lat: number, lng: number) {
    this.geocoding.set(true);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
                `?access_token=${environment.mapboxToken}&language=uk&types=address,place,locality&limit=1`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const feature = data?.features?.[0];
        if (feature?.place_name) {
          this.zone.run(() => {
            this.addressChange.emit(feature.place_name as string);
          });
        }
      })
      .catch(() => {})
      .finally(() => this.zone.run(() => this.geocoding.set(false)));
  }

  locateMe() {
    if (!isPlatformBrowser(this.platformId) || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      this.zone.runOutsideAngular(() => {
        if (this.map && this.marker) {
          this.marker.setLngLat([lng, lat]);
          this.map.flyTo({ center: [lng, lat], zoom: 14 });
        }
      });
      this.updateCoords(lat, lng);
      this.reverseGeocode(lat, lng);
    }, () => {});
  }

  moveTo(lat: number, lng: number) {
    this.zone.runOutsideAngular(() => {
      if (this.map && this.marker) {
        this.marker.setLngLat([lng, lat]);
        this.map.flyTo({ center: [lng, lat] });
      }
    });
    this.currentLat.set(lat);
    this.currentLng.set(lng);
  }

  ngOnDestroy() { this.map?.remove(); }
}
