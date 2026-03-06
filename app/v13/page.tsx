"use client";

import dynamic from "next/dynamic";

const V13Page = dynamic(() => import("./V13Page"), { ssr: false });

export default function Page() {
  return <V13Page />;
}
