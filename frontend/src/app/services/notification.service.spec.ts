import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatSnackBarModule, BrowserAnimationsModule],
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should show success notification', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.success('Success message');
    
    expect(spy).toHaveBeenCalledWith(
      'Success message',
      'Close',
      expect.objectContaining({
        duration: 4000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['notification-success']
      })
    );
  });

  it('should show error notification', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.error('Error message');
    
    expect(spy).toHaveBeenCalledWith(
      'Error message',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-error']
      })
    );
  });

  it('should show warning notification', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.warning('Warning message');
    
    expect(spy).toHaveBeenCalledWith(
      'Warning message',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-warning']
      })
    );
  });

  it('should show info notification', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.info('Info message');
    
    expect(spy).toHaveBeenCalledWith(
      'Info message',
      'Close',
      expect.objectContaining({
        panelClass: ['notification-info']
      })
    );
  });

  it('should show notification with custom duration', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.show('Custom message', 'info', 5000);
    
    expect(spy).toHaveBeenCalledWith(
      'Custom message',
      'Close',
      expect.objectContaining({
        duration: 5000
      })
    );
  });

  it('should use default duration when not specified', () => {
    const spy = jest.spyOn(snackBar, 'open');
    service.show('Message');
    
    expect(spy).toHaveBeenCalledWith(
      'Message',
      'Close',
      expect.objectContaining({
        duration: 4000
      })
    );
  });
});

