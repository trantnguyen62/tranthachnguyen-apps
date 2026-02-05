"use client";

import { CodeBlock } from "./CodeBlock";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface Parameter {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

interface APIEndpointProps {
  method: HttpMethod;
  endpoint: string;
  description: string;
  parameters?: Parameter[];
  requestBody?: string;
  responseBody?: string;
  authRequired?: boolean;
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-green-500",
  POST: "bg-blue-500",
  PUT: "bg-yellow-500",
  PATCH: "bg-orange-500",
  DELETE: "bg-red-500",
};

export function APIEndpoint({
  method,
  endpoint,
  description,
  parameters,
  requestBody,
  responseBody,
  authRequired = true,
}: APIEndpointProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden my-6">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <span
          className={`${methodColors[method]} text-white text-xs font-bold px-2 py-1 rounded`}
        >
          {method}
        </span>
        <code className="text-sm font-mono text-gray-800">{endpoint}</code>
        {authRequired && (
          <span className="ml-auto text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
            Auth Required
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <p className="text-gray-700">{description}</p>

        {/* Parameters */}
        {parameters && parameters.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters</h4>
            <div className="border border-gray-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Required</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {parameters.map((param) => (
                    <tr key={param.name}>
                      <td className="px-3 py-2 font-mono text-gray-800">{param.name}</td>
                      <td className="px-3 py-2 text-gray-600">{param.type}</td>
                      <td className="px-3 py-2">
                        {param.required ? (
                          <span className="text-red-600">Yes</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Request Body */}
        {requestBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Request Body</h4>
            <CodeBlock code={requestBody} language="json" />
          </div>
        )}

        {/* Response */}
        {responseBody && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Response</h4>
            <CodeBlock code={responseBody} language="json" />
          </div>
        )}
      </div>
    </div>
  );
}
