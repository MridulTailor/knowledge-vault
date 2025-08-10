"use client"

import { useState, useEffect } from "react"

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string }>
}

class GraphQLClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Initialize token from localStorage if available
    if (typeof window !== "undefined") {
      this.token = localStorage.getItem("token")
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== "undefined") {
      if (token) {
        localStorage.setItem("token", token)
      } else {
        localStorage.removeItem("token")
      }
    }
  }

  async request<T>(query: string, variables?: any): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    })

    const result: GraphQLResponse<T> = await response.json()

    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message)
    }

    if (!result.data) {
      throw new Error("No data received")
    }

    return result.data
  }
}

export const graphqlClient = new GraphQLClient("/api/graphql")

// Custom hook for GraphQL queries
export function useQuery<T>(query: string, variables?: any, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await graphqlClient.request<T>(query, variables)
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    execute()
  }, deps)

  return { data, loading, error, refetch: execute }
}

// Custom hook for GraphQL mutations
export function useMutation<T>(mutation: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = async (variables?: any): Promise<T> => {
    try {
      setLoading(true)
      setError(null)
      const result = await graphqlClient.request<T>(mutation, variables)
      return result
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error }
}
