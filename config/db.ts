import mongoose from "mongoose"

// This checks if MONGODB_URI exists in your .env file
// If not — crash early with a clear message
const MONGODB_URI = process.env.MONGODB_URI as string

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local")
}

/**
 * THE WHY?
 * --------
 * This is object actually defining the mongoose globally so it should stop nextjs for creating new Database string every time it hit the db.
 */
declare global {
  var mongoose: {
    conn: mongoose.Connection | null
    promise: Promise<mongoose.Connection> | null
  }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

const CONNECT_RETRIES = 3
const RETRY_DELAY_MS = 600

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSrvDnsError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ECONNREFUSED" &&
    "syscall" in error &&
    (error as { syscall?: string }).syscall === "querySrv"
  )
}

async function tryConnect() {
  let lastError: unknown

  for (let attempt = 1; attempt <= CONNECT_RETRIES; attempt++) {
    try {
      const connection = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 10000,
      })
      return connection.connection
    } catch (error) {
      lastError = error
      if (attempt < CONNECT_RETRIES) {
        await delay(RETRY_DELAY_MS)
      }
    }
  }

  if (isSrvDnsError(lastError)) {
    throw new Error(
      "Database DNS lookup failed while resolving MongoDB SRV record. Please verify your internet/DNS and try again.",
    )
  }

  throw lastError
}

export async function connectDB() {
  // Already connected? Return immediately
  if (cached.conn) {
    return cached.conn
  }

  // Connection in progress? Wait for it
  if (!cached.promise) {
    cached.promise = tryConnect()
  }

  try {
    cached.conn = await cached.promise
  } catch (error) {
    // Clear failed promise so the next request can retry cleanly.
    cached.promise = null
    throw error
  }

  return cached.conn
}
