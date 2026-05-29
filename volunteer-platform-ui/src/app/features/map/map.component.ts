import {
  Component, OnInit, OnDestroy, signal, effect, ElementRef, ViewChild, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { InitiativesService } from '../../core/services/initiatives.service';
import { SignalRService } from '../../core/services/signalr.service';
import { AuthService } from '../../core/services/auth.service';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { InitiativeCardComponent } from './initiative-card/initiative-card.component';
import { InitiativeDetailComponent } from './initiative-detail/initiative-detail.component';
import { SkeletonComponent } from '../../shared/components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { InitiativeDto, InitiativeFilters, InitiativeMapDto } from '../../shared/models/initiative.model';

// ── Mapbox data expressions ──────────────────────────────────────────────────

const CATEGORY_COLOR_EXPR = [
  'match', ['get', 'category'],
  'Environmental', '#1D9E75',
  'Social',        '#378ADD',
  'Medical',       '#E24B4A',
  'Educational',   '#EF9F27',
  /* default */    '#888780'
] as any;

const URGENCY_WEIGHT_EXPR = [
  'match', ['get', 'urgencyLevel'],
  'Low',      0.25,
  'Medium',   0.5,
  'High',     0.75,
  'Critical', 1.0,
  0.5
] as any;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Approximate geographic circle polygon (64-step) around [lng, lat] with radius in km. */
function circlePolygon(lng: number, lat: number, radiusKm: number, steps = 64): any {
  const coords: [number, number][] = [];
  const latR = radiusKm / 110.574;
  const lngR = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    coords.push([lng + lngR * Math.sin(a), lat + latR * Math.cos(a)]);
  }
  return {
    type: 'Feature', properties: {},
    geometry: { type: 'Polygon', coordinates: [coords] }
  };
}

function emptyGeoJSON(): any {
  return { type: 'FeatureCollection', features: [] };
}

// ────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatProgressSpinnerModule, MatButtonModule, MatIconModule,
    MatDividerModule, MatSnackBarModule, MatTooltipModule,
    FilterPanelComponent, InitiativeCardComponent, InitiativeDetailComponent,
    SkeletonComponent, EmptyStateComponent
  ],
  template: `
    <div class="map-layout">
      <!-- ── Sidebar ─────────────────────────────────────────────── -->
      <div class="sidebar">
        <div class="sidebar-header">
          @if (auth.isLoggedIn()) {
            <button mat-raised-button color="primary" class="create-action" routerLink="/initiative/create">
              <mat-icon>add</mat-icon>
              Створити ініціативу
            </button>
          }
          <div class="filter-toggle-row">
            <button mat-button class="filter-toggle-btn" (click)="filterOpen.set(!filterOpen())">
              <mat-icon>{{ filterOpen() ? 'filter_list_off' : 'filter_list' }}</mat-icon>
              <span>{{ filterOpen() ? 'Сховати фільтри' : 'Показати фільтри' }}</span>
            </button>
          </div>
        </div>
        @if (filterOpen()) {
          <app-filter-panel (filtersChanged)="onFiltersChanged($event)" [initialStatus]="initialStatus()" [initialEmergency]="initialEmergency()" />
          <mat-divider></mat-divider>
        }

        <div class="list-container">
          @if (loading()) {
            <div class="skeleton-list">
              @for (i of skeletonItems; track i) {
                <app-skeleton type="card" />
              }
            </div>
          } @else {
            @for (initiative of initiatives(); track initiative.id) {
              <app-initiative-card
                [initiative]="initiative"
                [highlighted]="hoveredId() === initiative.id"
                (hover)="onCardHover($event)"
                (select)="onCardSelect($event)" />
            }
            @if (initiatives().length === 0) {
              <app-empty-state
                icon="search_off"
                title="Ініціативи не знайдено"
                subtitle="Спробуйте змінити фільтри або розширити область пошуку" />
            }
            @if (hasNextPage()) {
              <button mat-stroked-button class="load-more" (click)="loadMore()">
                Завантажити ще
              </button>
            }
          }
        </div>
      </div>

      <!-- ── Map container ──────────────────────────────────────── -->
      <div class="map-container">
        <div #mapContainer class="map-canvas"></div>

        <!-- Map controls overlay -->
        <div class="map-controls">
          <button
            mat-mini-fab
            [color]="viewMode() === 'cluster' ? 'primary' : 'basic'"
            (click)="setViewMode('cluster')"
            matTooltip="Режим кластерів"
            matTooltipPosition="right"
            class="map-ctrl-btn">
            <mat-icon>bubble_chart</mat-icon>
          </button>
          <button
            mat-mini-fab
            [color]="viewMode() === 'heatmap' ? 'accent' : 'basic'"
            (click)="setViewMode('heatmap')"
            matTooltip="Теплова карта"
            matTooltipPosition="right"
            class="map-ctrl-btn">
            <mat-icon>whatshot</mat-icon>
          </button>
        </div>

        <!-- Category legend -->
        <div class="map-legend">
          <div class="legend-row"><span class="dot" style="background:#1D9E75"></span>Екологічна</div>
          <div class="legend-row"><span class="dot" style="background:#378ADD"></span>Соціальна</div>
          <div class="legend-row"><span class="dot" style="background:#E24B4A"></span>Медична</div>
          <div class="legend-row"><span class="dot" style="background:#EF9F27"></span>Освітня</div>
          <div class="legend-row"><span class="dot" style="background:#888780"></span>Інша</div>
          <div class="legend-row emergency-row">
            <span class="dot" style="background:#e53935"></span>🚨 Екстрена
          </div>
        </div>
      </div>

      <!-- ── Detail drawer ──────────────────────────────────────── -->
      @if (selectedInitiative()) {
        <div class="detail-drawer">
          <app-initiative-detail
            [initiative]="selectedInitiative()!"
            (close)="closeDetail()" />
        </div>
      }
    </div>
  `,
  styles: [`
    .map-layout {
      display: flex;
      height: calc(100vh - 64px);
      position: relative;
    }

    /* Sidebar */
    .sidebar {
      width: 380px;
      min-width: 380px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sidebar-header {
      padding: 12px 12px 0;
    }
    .create-action {
      width: 100%;
      justify-content: center;
    }
    .filter-toggle-row {
      display: flex;
      justify-content: flex-start;
      margin-top: 6px;
    }
    .filter-toggle-btn {
      font-size: 12px;
      color: #546e7a;
      padding: 0 6px;
      height: 28px;
      min-width: unset;
    }
    .filter-toggle-btn mat-icon { font-size: 16px; width: 16px; height: 16px; margin-right: 4px; }
    .list-container {
      flex: 1;
      overflow-y: auto;
      padding: 8px 12px;
    }
    .skeleton-list { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
    .load-more {
      width: 100%; margin-top: 8px; margin-bottom: 16px;
    }


    /* Map */
    .map-container {
      flex: 1;
      position: relative;
      overflow: hidden;
    }
    .map-canvas {
      width: 100%;
      height: 100%;
    }

    /* Map controls overlay */
    .map-controls {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 5;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .map-ctrl-btn {
      box-shadow: 0 2px 8px rgba(0,0,0,0.25) !important;
    }

    /* Legend */
    .map-legend {
      position: absolute;
      bottom: 32px;
      left: 12px;
      background: rgba(255,255,255,0.95);
      border-radius: 8px;
      padding: 8px 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      z-index: 5;
      font-size: 12px;
    }
    .legend-row {
      display: flex; align-items: center; gap: 6px;
      margin-bottom: 4px; color: #424242;
    }
    .legend-row:last-child { margin-bottom: 0; }
    .emergency-row { font-weight: 600; color: #c62828; }
    .dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }

    /* Detail drawer */
    .detail-drawer {
      position: absolute;
      right: 0; top: 0;
      width: 380px;
      height: 100%;
      background: white;
      box-shadow: -4px 0 16px rgba(0,0,0,0.15);
      z-index: 10;
      overflow-y: auto;
    }

    @media (max-width: 768px) {
      .map-layout { flex-direction: column; height: auto; min-height: calc(100vh - 56px); }
      .sidebar { width: 100%; min-width: unset; height: 42vh; border-right: none; border-bottom: 1px solid #e0e0e0; }
      .map-container { height: 58vh; }
      .detail-drawer { width: 100%; top: auto; bottom: 0; height: 60%; border-radius: 16px 16px 0 0; }
      .map-legend { display: none; }
      .map-controls { top: 8px; left: 8px; }
    }
  `]
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  // ── Angular DI ────────────────────────────────────────────────────────────
  private initiativesService = inject(InitiativesService);
  private signalR = inject(SignalRService);
  protected auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private platformId = inject(PLATFORM_ID);
  private route = inject(ActivatedRoute);

  // ── Signals ───────────────────────────────────────────────────────────────
  initiatives = signal<InitiativeDto[]>([]);
  loading = signal(false);
  hoveredId = signal<string | null>(null);
  selectedInitiative = signal<InitiativeDto | null>(null);
  hasNextPage = signal(false);
  viewMode = signal<'cluster' | 'heatmap'>('cluster');

  skeletonItems = [1, 2, 3, 4, 5];

  // ── Map internals ─────────────────────────────────────────────────────────
  private map: any;
  private mapboxgl: any;
  private mapReady = false;
  private pendingMapData: InitiativeMapDto[] | null = null;
  private emergencyAnimId: number | null = null;
  private subs = new Subscription();
  private filters: InitiativeFilters = { page: 1, pageSize: 20, sortBy: 'date' };
  initialStatus    = signal('');
  initialEmergency = signal(false);
  filterOpen       = signal(true);

  constructor() {
    // Clear radius circle when detail panel is closed
    effect(() => {
      if (!this.selectedInitiative()) {
        this.clearRadiusCircle();
      }
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      await this.initMap();
    }

    // Subscribe to queryParamMap so navigation from dashboard works even when
    // this component is already alive (snapshot only fires on first init).
    this.subs.add(
      this.route.queryParamMap.pipe(distinctUntilChanged()).subscribe(params => {
        const statusParam    = params.get('status');
        const emergencyParam = params.get('isEmergency');

        this.filters = { page: 1, pageSize: 20, sortBy: 'date' };
        this.initialStatus.set('');
        this.initialEmergency.set(false);

        if (statusParam) {
          this.filters = { ...this.filters, status: statusParam as any };
          this.initialStatus.set(statusParam);
        }
        if (emergencyParam === 'true') {
          this.filters = { ...this.filters, isEmergency: true };
          this.initialEmergency.set(true);
        }

        this.loadInitiatives();
        this.loadMapPoints();
      })
    );

    const token = this.auth.token();
    if (token) {
      this.signalR.startConnection(token);

      this.subs.add(this.signalR.applicationStatusChanged$.subscribe(data => {
        const msg = data.status === 'Approved' ? 'Вашу заявку ухвалено! 🎉' : 'Вашу заявку відхилено.';
        this.snackBar.open(msg, 'OK', { duration: 5000 });
      }));

      this.subs.add(this.signalR.newInitiativeCreated$.subscribe(data => {
        this.loadMapPoints();
        this.snackBar.open(`Нова ініціатива: ${data.title}`, 'Переглянути', { duration: 5000 });
      }));

      this.subs.add(this.signalR.emergencyInitiative$.subscribe(data => {
        this.snackBar.open(`🚨 Екстрена ситуація: ${data.title}`, 'OK', {
          duration: 8000,
          panelClass: ['emergency-snack']
        });
        this.loadMapPoints();
      }));
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.signalR.stopConnection();
    if (this.emergencyAnimId !== null) cancelAnimationFrame(this.emergencyAnimId);
    this.map?.remove();
  }

  // ── Map initialisation ────────────────────────────────────────────────────

  private initMap(): Promise<void> {
    return new Promise(resolve => {
      import('mapbox-gl').then(({ default: mapboxgl }) => {
        this.mapboxgl = mapboxgl;

        this.map = new mapboxgl.Map({
          accessToken: environment.mapboxToken,
          container: this.mapContainer.nativeElement,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [24.03, 49.84],
          zoom: 11
        });

        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        this.map.addControl(new mapboxgl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true
        }), 'top-right');
        this.map.addControl(new mapboxgl.ScaleControl({ unit: 'metric' }), 'bottom-right');

        this.map.on('load', () => {
          this.setupSources();
          this.setupLayers();
          this.setupMapEvents();
          this.mapReady = true;

          if (this.pendingMapData) {
            this.applyMapData(this.pendingMapData);
            this.pendingMapData = null;
          }

          this.animateEmergencyPulse();
          resolve();
        });
      });
    });
  }

  // ── Sources ───────────────────────────────────────────────────────────────

  private setupSources() {
    // Clustered source for cluster + point layers
    this.map.addSource('initiatives', {
      type: 'geojson',
      data: emptyGeoJSON(),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Non-clustered source for heatmap (same data, no clustering)
    this.map.addSource('initiatives-raw', {
      type: 'geojson',
      data: emptyGeoJSON()
    });

    // Source for selected initiative's coverage radius
    this.map.addSource('radius', {
      type: 'geojson',
      data: emptyGeoJSON()
    });
  }

  // ── Layers ────────────────────────────────────────────────────────────────

  private setupLayers() {
    // ─ Coverage radius circle (bottom — drawn first) ─────────────────────
    this.map.addLayer({
      id: 'radius-fill',
      type: 'fill',
      source: 'radius',
      paint: { 'fill-color': '#1565c0', 'fill-opacity': 0.08 }
    });
    this.map.addLayer({
      id: 'radius-outline',
      type: 'line',
      source: 'radius',
      paint: {
        'line-color': '#1565c0',
        'line-width': 1.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.7
      }
    });

    // ─ Heatmap (hidden by default, shown in heatmap mode) ─────────────────
    this.map.addLayer({
      id: 'heatmap',
      type: 'heatmap',
      source: 'initiatives-raw',
      maxzoom: 16,
      paint: {
        'heatmap-weight': URGENCY_WEIGHT_EXPR,
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 15, 3],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,   'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1,   'rgb(178,24,43)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 15, 22],
        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 12, 1, 16, 0]
      },
      layout: { visibility: 'none' }
    });

    // ─ Emergency pulse ring (pulsed via rAF) ──────────────────────────────
    this.map.addLayer({
      id: 'emergency-pulse',
      type: 'circle',
      source: 'initiatives',
      filter: ['all',
        ['!', ['has', 'point_count']],
        ['==', ['get', 'isEmergency'], true]
      ],
      paint: {
        'circle-color': '#e53935',
        'circle-radius': 20,
        'circle-opacity': 0.15,
        'circle-blur': 0.6
      }
    });

    // ─ Clusters ───────────────────────────────────────────────────────────
    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'initiatives',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step', ['get', 'point_count'],
          '#1565c0',  5,
          '#0288d1', 20,
          '#01579b'
        ],
        'circle-radius': [
          'step', ['get', 'point_count'],
          22,  5,
          30, 20,
          38
        ],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // ─ Cluster labels ─────────────────────────────────────────────────────
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'initiatives',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 13
      },
      paint: { 'text-color': '#ffffff' }
    });

    // ─ Individual (unclustered) points ────────────────────────────────────
    this.map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'initiatives',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': CATEGORY_COLOR_EXPR,
        'circle-radius': ['case', ['==', ['get', 'isEmergency'], true], 13, 10],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff'
      }
    });

    // ─ Hover highlight ring (top layer) ──────────────────────────────────
    this.map.addLayer({
      id: 'hovered-point',
      type: 'circle',
      source: 'initiatives',
      filter: ['==', ['get', 'id'], ''],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-radius': 17,
        'circle-stroke-width': 3,
        'circle-stroke-color': CATEGORY_COLOR_EXPR
      }
    });
  }

  // ── Map events ────────────────────────────────────────────────────────────

  private setupMapEvents() {
    // Cluster click → zoom into cluster bounds
    this.map.on('click', 'clusters', (e: any) => {
      const features = this.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      if (!features.length) return;
      const clusterId = features[0].properties.cluster_id;
      (this.map.getSource('initiatives') as any).getClusterExpansionZoom(
        clusterId,
        (err: any, zoom: number) => {
          if (err) return;
          this.map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom + 1
          });
        }
      );
    });

    // Individual point click → fetch full DTO, open detail, show radius
    this.map.on('click', 'unclustered-point', (e: any) => {
      const props = e.features[0].properties;
      this.initiativesService.getById(props.id).subscribe(dto => {
        this.selectedInitiative.set(dto);
        this.showRadiusCircle(dto.longitude, dto.latitude, dto.radiusKm);
        this.map.flyTo({
          center: [props.longitude ?? dto.longitude, props.latitude ?? dto.latitude],
          zoom: Math.max(this.map.getZoom(), 13),
          duration: 600
        });
      });
    });

    // Hover: unclustered points
    this.map.on('mouseenter', 'unclustered-point', (e: any) => {
      const id = e.features[0].properties.id;
      this.hoveredId.set(id);
      this.map.setFilter('hovered-point', ['==', ['get', 'id'], id]);
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'unclustered-point', () => {
      this.hoveredId.set(null);
      this.map.setFilter('hovered-point', ['==', ['get', 'id'], '']);
      this.map.getCanvas().style.cursor = '';
    });

    // Cursor for clusters
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  // ── Emergency animation ───────────────────────────────────────────────────

  private animateEmergencyPulse() {
    const tick = () => {
      const t = (Date.now() % 2400) / 2400;
      const opacity = 0.08 + 0.22 * Math.abs(Math.sin(t * Math.PI));
      const radius  = 16 + 6  * Math.abs(Math.sin(t * Math.PI));
      if (this.map?.getLayer('emergency-pulse')) {
        this.map.setPaintProperty('emergency-pulse', 'circle-opacity', opacity);
        this.map.setPaintProperty('emergency-pulse', 'circle-radius', radius);
      }
      this.emergencyAnimId = requestAnimationFrame(tick);
    };
    this.emergencyAnimId = requestAnimationFrame(tick);
  }

  // ── Data updates ─────────────────────────────────────────────────────────

  private buildGeoJSON(points: InitiativeMapDto[]): any {
    return {
      type: 'FeatureCollection',
      features: points.map(p => ({
        type: 'Feature',
        properties: {
          id: p.id,
          title: p.title,
          category: p.category,
          status: p.status,
          urgencyLevel: p.urgencyLevel,
          isEmergency: p.isEmergency,
          radiusKm: p.radiusKm
        },
        geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }
      }))
    };
  }

  private applyMapData(points: InitiativeMapDto[]) {
    const geojson = this.buildGeoJSON(points);
    (this.map.getSource('initiatives') as any)?.setData(geojson);
    (this.map.getSource('initiatives-raw') as any)?.setData(geojson);
  }

  // ── Radius circle ─────────────────────────────────────────────────────────

  private showRadiusCircle(lng: number, lat: number, radiusKm: number) {
    if (!this.mapReady) return;
    const geojson = {
      type: 'FeatureCollection',
      features: radiusKm > 0 ? [circlePolygon(lng, lat, radiusKm)] : []
    };
    (this.map.getSource('radius') as any)?.setData(geojson);
  }

  private clearRadiusCircle() {
    if (!this.mapReady) return;
    (this.map.getSource('radius') as any)?.setData(emptyGeoJSON());
  }

  // ── View mode toggle ──────────────────────────────────────────────────────

  setViewMode(mode: 'cluster' | 'heatmap') {
    if (!this.mapReady) return;
    this.viewMode.set(mode);
    const clusterLayers = ['clusters', 'cluster-count', 'unclustered-point', 'hovered-point', 'emergency-pulse'];
    const clusterVis = mode === 'cluster' ? 'visible' : 'none';
    const heatmapVis = mode === 'heatmap' ? 'visible' : 'none';

    clusterLayers.forEach(id => {
      if (this.map.getLayer(id)) {
        this.map.setLayoutProperty(id, 'visibility', clusterVis);
      }
    });
    if (this.map.getLayer('heatmap')) {
      this.map.setLayoutProperty('heatmap', 'visibility', heatmapVis);
    }
  }

  // ── Data loading ─────────────────────────────────────────────────────────

  private loadInitiatives(append = false) {
    this.loading.set(true);
    this.initiativesService.getAll(this.filters).subscribe({
      next: result => {
        this.initiatives.update(list => append ? [...list, ...result.items] : result.items);
        this.hasNextPage.set(result.hasNextPage);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadMapPoints() {
    this.initiativesService.getMapPoints().subscribe(points => {
      if (this.mapReady) {
        this.applyMapData(points);
      } else {
        this.pendingMapData = points;
      }
    });
  }

  // ── Template handlers ─────────────────────────────────────────────────────

  onFiltersChanged(filters: Partial<InitiativeFilters>) {
    this.filters = { ...this.filters, ...filters, page: 1 };
    this.loadInitiatives();
  }

  onCardHover(id: string | null) {
    this.hoveredId.set(id);
    if (this.mapReady) {
      this.map.setFilter('hovered-point', ['==', ['get', 'id'], id ?? '']);
    }
  }

  onCardSelect(initiative: InitiativeDto) {
    this.selectedInitiative.set(initiative);
    if (this.mapReady) {
      this.showRadiusCircle(initiative.longitude, initiative.latitude, initiative.radiusKm);
      this.map.flyTo({
        center: [initiative.longitude, initiative.latitude],
        zoom: Math.max(this.map.getZoom(), 13),
        duration: 700
      });
    }
  }

  closeDetail() {
    this.selectedInitiative.set(null);
  }

  loadMore() {
    this.filters.page++;
    this.loadInitiatives(true);
  }
}
