#!/usr/bin/env python3
"""
ATLAS Local Development Server
Simple HTTP server to serve the ATLAS website locally for development and testing.
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import socket
from pathlib import Path

class ATLASHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler with better error handling and logging"""
    
    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Suppress favicon.ico logs
        if args[0].startswith('GET /favicon.ico'):
            return
        # Custom logging format
        print(f"[ATLAS Server] {format % args}")

def find_free_port(start_port=8000, max_attempts=10):
    """Find a free port starting from start_port"""
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    return None

def main():
    # Ensure we're in the correct directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Check if index.html exists
    if not Path('index.html').exists():
        print("❌ Error: index.html not found in current directory")
        print(f"📁 Current directory: {script_dir}")
        sys.exit(1)
    
    # Find available port
    port = find_free_port()
    if port is None:
        print("❌ Error: Unable to find a free port")
        sys.exit(1)
    
    # Create server
    try:
        with socketserver.TCPServer(("localhost", port), ATLASHTTPRequestHandler) as httpd:
            server_url = f"http://localhost:{port}"
            
            print("🚀 ATLAS Development Server")
            print("=" * 40)
            print(f"📁 Directory: {script_dir}")
            print(f"🌐 URL: {server_url}")
            print(f"🔌 Port: {port}")
            print("=" * 40)
            print("💡 Press Ctrl+C to stop the server")
            print()
            
            # Open browser
            try:
                webbrowser.open(server_url)
                print(f"🌍 Opening {server_url} in your browser...")
            except Exception as e:
                print(f"⚠️  Unable to automatically open browser: {e}")
                print(f"📌 Manually open: {server_url}")
            
            print()
            print("🟢 Server started successfully!")
            print("📝 Request logs:")
            print("-" * 40)
            
            # Start serving
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n" + "=" * 40)
        print("🛑 Stopping server...")
        print("👋 Goodbye!")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
