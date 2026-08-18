import { Pipe, PipeTransform } from '@angular/core';
import { Appointment } from '../models/patient.model';
@Pipe({ name: 'unpaidCount' })
export class UnpaidCountPipe implements PipeTransform {
    transform(items: Appointment[]): number { return (items || []).filter(item => !item.paid && item.status !== 'cancelled').length; }
}
