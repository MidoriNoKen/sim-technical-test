"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to prevent Server-Side Rendering errors
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

type Props = {
  spec: Record<string, unknown>;
};

export default function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}
