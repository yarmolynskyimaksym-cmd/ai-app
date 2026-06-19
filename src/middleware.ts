import { NextRequest, NextResponse } from "next/server";

// Auth redirect handled in each (app) layout via auth()
// This middleware is kept minimal to avoid Edge runtime conflicts
export function middleware(req: NextRequest) {
  return NextResponse.next();
}

export const config = { matcher: [] };
