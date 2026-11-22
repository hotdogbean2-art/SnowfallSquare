import SwiftUI
import WebKit

struct StartView: View {
    @AppStorage("snowfallServerURL") private var serverURL = ""
    @State private var playing = false
    @State private var error = ""

    var body: some View {
        Group {
            if playing, let url = URL(string: normalizedURL) {
                GameWebView(url: url) {
                    playing = false
                }
                .ignoresSafeArea()
            } else {
                VStack(spacing: 22) {
                    Spacer()
                    Text("☃️").font(.system(size: 82))
                    Text("Snowfall Square").font(.system(size: 32, weight: .heavy, design: .rounded)).foregroundStyle(Color(red: 0.18, green: 0.34, blue: 0.48))
                    Text("Meet friends in a cozy snowy town.").font(.title3).foregroundStyle(.secondary)
                    TextField("Game server address", text: $serverURL)
                        .textInputAutocapitalization(.never).keyboardType(.URL).autocorrectionDisabled()
                        .padding(16).background(.white, in: RoundedRectangle(cornerRadius: 15))
                    Button("Enter the town") {
                        guard let url = URL(string: normalizedURL), ["https", "http"].contains(url.scheme?.lowercased() ?? ""), url.host != nil else {
                            error = "Enter the web address where Snowfall Square is hosted."
                            return
                        }
                        error = ""; playing = true
                    }
                    .font(.headline).foregroundStyle(.white).padding(.vertical, 15).frame(maxWidth: .infinity)
                    .background(Color(red: 0.31, green: 0.56, blue: 0.69), in: Capsule())
                    if !error.isEmpty { Text(error).foregroundStyle(.red).font(.footnote) }
                    Text("The multiplayer game server must be online.").font(.footnote).foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(28).background(LinearGradient(colors: [Color(red: 0.82, green: 0.93, blue: 0.97), .white], startPoint: .top, endPoint: .bottom))
            }
        }
        .preferredColorScheme(.light)
    }

    private var normalizedURL: String {
        let value = serverURL.trimmingCharacters(in: .whitespacesAndNewlines)
        return value.contains("://") ? value : "https://\(value)"
    }
}

struct GameWebView: UIViewRepresentable {
    let url: URL
    let onClose: () -> Void
    func makeUIView(context: Context) -> WKWebView {
        let web = WKWebView()
        web.scrollView.isScrollEnabled = false
        web.allowsBackForwardNavigationGestures = true
        web.load(URLRequest(url: url))
        return web
    }
    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
