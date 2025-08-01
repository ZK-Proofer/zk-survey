import { HttpException, HttpStatus } from '@nestjs/common';

export class SurveyNotFoundException extends HttpException {
  constructor(message: string = 'Survey not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class SurveyClosedException extends HttpException {
  constructor(
    message: string = 'Survey is closed and no longer accepting responses',
  ) {
    super(message, HttpStatus.CONFLICT);
  }
}

export class SurveyActiveException extends HttpException {
  constructor(message: string = 'Cannot modify an active survey') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class InvitationNotFoundException extends HttpException {
  constructor(message: string = 'Invitation not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class InvitationAlreadyExistsException extends HttpException {
  constructor(message: string = 'Invitation already exists for this email') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class CommitmentNotFoundException extends HttpException {
  constructor(message: string = 'Commitment not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class CommitmentInvalidException extends HttpException {
  constructor(message: string = 'Commitment is not valid') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class ProofVerificationException extends HttpException {
  constructor(message: string = 'Proof verification failed') {
    super(message, HttpStatus.CONFLICT);
  }
}

export class SurveyResponseNotFoundException extends HttpException {
  constructor(message: string = 'Survey response not found') {
    super(message, HttpStatus.NOT_FOUND);
  }
}
