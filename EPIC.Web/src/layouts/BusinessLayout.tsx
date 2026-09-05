import React from "react";
import "../components/business/business.css";

export default function BusinessLayout({children}:{children:React.ReactNode}){return <div className="business-layout"><header className="business-header"><strong>EPIC Platform</strong><nav><a href="/business">Home</a><a href="/platform">Platform</a><a href="/academy">Academy</a><a href="/store">Store</a><a href="/pricing">Pricing</a><a href="/resources">Resources</a></nav><a className="business-button" href="/login">Login</a></header><main className="business-main">{children}</main><footer className="business-footer">© EPIC Ministry Platform</footer></div>}
