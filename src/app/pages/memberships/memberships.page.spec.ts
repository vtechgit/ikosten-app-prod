import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MembershipsPage } from './memberships.page';

describe('MembershipsPage', () => {
  let component: MembershipsPage;
  let fixture: ComponentFixture<MembershipsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MembershipsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
