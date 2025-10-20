// LCI API - Update Complaint DTO
// White-hat: Partial updates only

import { PartialType } from '@nestjs/swagger';
import { CreateComplaintDto } from './create-complaint.dto';

export class UpdateComplaintDto extends PartialType(CreateComplaintDto) {}
