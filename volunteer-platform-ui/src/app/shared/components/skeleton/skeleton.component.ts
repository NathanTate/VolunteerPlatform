import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable shimmer skeleton.
 *
 * Usage:
 *   <app-skeleton />                      — single full-width text line
 *   <app-skeleton width="60%" />          — partial-width text line
 *   <app-skeleton type="card" />          — card-shaped block (120px tall)
 *   <app-skeleton type="circle" size="40px" /> — circular avatar
 *   <app-skeleton [count]="3" />          — stacked text lines
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (i of items(); track i) {
      <div
        class="skeleton-block skeleton"
        [class]="'type-' + type()"
        [style.width]="resolvedWidth(i)"
        [style.height]="resolvedHeight()"
        [style.border-radius]="type() === 'circle' ? '50%' : null"
        [style.margin-bottom]="count() > 1 && !$last ? '8px' : null">
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .skeleton-block {
      width: 100%;
    }

    /* Text line */
    .type-text   { height: 14px; }

    /* Card */
    .type-card   { height: 120px; width: 100% !important; border-radius: 10px !important; }

    /* Dashboard stat card */
    .type-stat   { height: 96px; width: 100% !important; border-radius: 10px !important; }

    /* Circle avatar */
    .type-circle { flex-shrink: 0; }

    /* Image */
    .type-image  { height: 160px; width: 100% !important; border-radius: 8px !important; }

    /* Chip/badge */
    .type-chip   { height: 22px; border-radius: 11px !important; }
  `]
})
export class SkeletonComponent {
  type   = input<'text' | 'card' | 'stat' | 'circle' | 'image' | 'chip'>('text');
  width  = input<string>('100%');
  size   = input<string>('40px');       // for circle
  height = input<string | null>(null);  // explicit height override
  count  = input<number>(1);

  /** widths can alternate to simulate natural text lines */
  private readonly ALT_WIDTHS = ['100%', '85%', '92%', '78%', '88%'];

  items = computed(() => Array.from({ length: this.count() }, (_, i) => i));

  resolvedHeight() {
    if (this.height()) return this.height();
    if (this.type() === 'circle') return this.size();
    return null;  // CSS class drives height
  }

  resolvedWidth(index: number) {
    if (this.type() === 'circle') return this.size();
    if (this.type() !== 'text') return '100%';
    if (this.width() !== '100%') return this.width();
    // For multi-line text, alternate widths naturally
    if (this.count() > 1) return this.ALT_WIDTHS[index % this.ALT_WIDTHS.length];
    return '100%';
  }
}
