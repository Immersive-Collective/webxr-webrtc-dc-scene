Creating a WebRTC connection between two clients without a signaling server is theoretically possible but practically challenging, especially for establishing the initial connection. The signaling process in WebRTC is crucial for exchanging information like session descriptions and ICE candidates between peers before a direct connection can be established.

However, if you're in a controlled environment where you can manually exchange this information (such as via email, chat, or even QR codes), you can establish a WebRTC connection without a traditional signaling server. This manual process is often referred to as "out-of-band" signaling.

Here's a simplified explanation of how it could work:

1. **Gather ICE Candidates and Create Offer on Client A:**
   - Client A creates an `RTCPeerConnection`.
   - Client A gathers ICE candidates.
   - Client A creates an offer (session description).

2. **Manually Transfer Offer and ICE Candidates to Client B:**
   - The offer and ICE candidates from Client A are transferred manually to Client B.

3. **Client B Sets Remote Description and Creates Answer:**
   - Client B sets the remote description using Client A's offer.
   - Client B gathers its ICE candidates.
   - Client B creates an answer (session description).

4. **Manually Transfer Answer and ICE Candidates Back to Client A:**
   - The answer and ICE candidates from Client B are transferred manually back to Client A.

5. **Client A Sets Remote Description:**
   - Client A sets the remote description using Client B's answer.

This process requires manual intervention to exchange the offer, answer, and ICE candidates. It's impractical for most real-world applications but can be used for testing or in very specific scenarios where a signaling server cannot be used.

For a typical WebRTC implementation, a signaling server is highly recommended to automate this exchange and establish a connection seamlessly. The signaling server doesn't relay media but simply helps in coordinating the connection between the peers.
