import { SquareClient, SquareEnvironment } from "square";

/** A Square API client acting as one seller (their OAuth access token). */
export function makeSquareClient(token: string): SquareClient {
  return new SquareClient({
    token,
    environment:
      process.env.SQUARE_ENVIRONMENT === "production"
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
  });
}
