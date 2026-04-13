import CodeMessage from "./codeMessage.js";
import StatusCodes from "./statusCodes.js";

class SystemResponse {
  static getInstance() {
    return new SystemResponse();
  }

  static success(message, data) {
    return {
      data: data || {},
      message: message || "msg.okay",
      status: StatusCodes.SUCCESS,
    };
  }

  getResponse(message, code) {
    return {
      message: message || CodeMessage[code],
      status: code,
    };
  }

  getErrorResponse(message, error, code) {
    return {
      error: error || {},
      message: message || CodeMessage[code],
      status: code,
    };
  }

  static continueInfo(message) {
    return this.getInstance().getResponse(message, StatusCodes.CONTINUE);
  }

  static switchingProtocolsInfo(message) {
    return this.getInstance().getResponse(
      message,
      StatusCodes.SWITCHING_PROTOCOLS,
    );
  }

  static multipleChoicesRedirect(message) {
    return this.getInstance().getResponse(
      message,
      StatusCodes.MULTIPLE_CHOICES,
    );
  }

  static movedPermanentlyRedirect(message) {
    return this.getInstance().getResponse(
      message,
      StatusCodes.MOVED_PERMANENTLY,
    );
  }

  static foundRedirect(message) {
    return this.getInstance().getResponse(message, StatusCodes.FOUND);
  }

  static seeOtherRedirect(message) {
    return this.getInstance().getResponse(message, StatusCodes.SEE_OTHER);
  }

  static notModifiedRedirect(message) {
    return this.getInstance().getResponse(message, StatusCodes.NOT_MODIFIED);
  }

  static useProxyRedirect(message) {
    return this.getInstance().getResponse(message, StatusCodes.USE_PROXY);
  }

  static temporaryRedirect(message) {
    return this.getInstance().getResponse(
      message,
      StatusCodes.TEMPORARY_REDIRECT,
    );
  }

  // =======================
  // 4xx Client Errors
  // =======================
  static badRequestError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.BAD_REQUEST,
    );
  }

  static unauthorizedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.UNAUTHORIZED,
    );
  }

  static paymentRequiredError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.PAYMENT_REQUIRED,
    );
  }

  static forbiddenError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.FORBIDDEN,
    );
  }

  static notFoundError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.NOT_FOUND,
    );
  }

  static methodNotAllowedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.METHOD_NOT_ALLOWED,
    );
  }

  static notAcceptableError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.NOT_ACCEPTABLE,
    );
  }

  static proxyAuthRequiredError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.PROXY_AUTHENTICATION_REQUIRED,
    );
  }

  static requestTimeoutError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.REQUEST_TIMEOUT,
    );
  }

  static conflictError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.CONFLICT,
    );
  }

  static goneError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.GONE,
    );
  }

  static lengthRequiredError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.LENGTH_REQUIRED,
    );
  }

  static preconditionFailedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.PRECONDITION_FAILED,
    );
  }

  static requestEntityTooLargeError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.REQUEST_ENTITY_TOO_LARGE,
    );
  }

  static requestUriTooLongError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.REQUEST_URI_TOO_LONG,
    );
  }

  static unsupportedMediaTypeError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.UNSUPPORTED_MEDIA_TYPE,
    );
  }

  static rangeNotSatisfiableError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.REQUESTED_RANGE_NOT_SATISFIABLE,
    );
  }

  static expectationFailedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.EXPECTATION_FAILED,
    );
  }

  static unprocessableEntityError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.UNPROCESSABLE_ENTITY,
    );
  }

  static tooManyRequestsError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.TOO_MANY_REQUESTS,
    );
  }

  // =======================
  // 5xx Server Errors
  // =======================
  static internalServerError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.INTERNAL_SERVER_ERROR,
    );
  }

  static notImplementedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.NOT_IMPLEMENTED,
    );
  }

  static badGatewayError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.BAD_GATEWAY,
    );
  }

  static serviceUnavailableError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.SERVICE_UNAVAILABLE,
    );
  }

  static gatewayTimeoutError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.GATEWAY_TIME_OUT,
    );
  }

  static httpVersionNotSupportedError(message, error) {
    return this.getInstance().getErrorResponse(
      message,
      error,
      StatusCodes.HTTP_VERSION_NOT_SUPPORTED,
    );
  }
}

export default SystemResponse;
