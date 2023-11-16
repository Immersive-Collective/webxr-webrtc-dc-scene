# OUT OF BAND - CONCEPT

## Synopsis


Creating a WebRTC connection between two clients without a signaling server indeed involves manual exchange of offer, answer, and ICE candidates. This "out-of-band" signaling can be done via any method that allows for direct communication of this data between the two parties, such as email, messaging, or even QR codes. 

Below is a basic example of how you can structure your WebRTC setup for two clients (Client A and Client B). This example assumes that you have a way to manually exchange the offer, answer, and ICE candidates (for instance, through copy-pasting between the clients).

### Client A's Code:

```javascript
const peerConnectionA = new RTCPeerConnection();

// When ICE candidate is found on Client A
peerConnectionA.onicecandidate = event => {
    if (event.candidate) {
        console.log("ICE Candidate (Client A): ", event.candidate);
    }
};

// Create data channel and offer
const dataChannel = peerConnectionA.createDataChannel("channel");
dataChannel.onmessage = event => console.log("Message from Client B:", event.data);

peerConnectionA.createOffer()
    .then(offer => peerConnectionA.setLocalDescription(offer))
    .then(() => {
        // Manually copy and send this offer to Client B
        console.log("Offer from Client A: ", peerConnectionA.localDescription);
    });
```

### Client B's Code:

```javascript
const peerConnectionB = new RTCPeerConnection();

// When ICE candidate is found on Client B
peerConnectionB.onicecandidate = event => {
    if (event.candidate) {
        // Manually copy and send this candidate to Client A
        console.log("ICE Candidate (Client B): ", event.candidate);
    }
};

peerConnectionB.ondatachannel = event => {
    const receiveChannel = event.channel;
    receiveChannel.onmessage = event => console.log("Message from Client A:", event.data);
};

// Manually set the remote description to the offer received from Client A
peerConnectionB.setRemoteDescription(offerFromClientA)
    .then(() => peerConnectionB.createAnswer())
    .then(answer => peerConnectionB.setLocalDescription(answer))
    .then(() => {
        // Manually copy and send this answer back to Client A
        console.log("Answer from Client B: ", peerConnectionB.localDescription);
    });
```

### Manual Steps:

1. **Exchange Offer:**
   - Client A creates an offer and logs it to the console.
   - This offer needs to be manually copied and given to Client B.

2. **Set Offer on Client B and Create Answer:**
   - Client B sets the received offer as its remote description and creates an answer.
   - The answer is logged to the console and must be manually copied back to Client A.

3. **Exchange ICE Candidates:**
   - Both clients log ICE candidates to the console.
   - These candidates need to be exchanged between the clients and added.

4. **Set Answer on Client A:**
   - Client A sets the received answer as its remote description.

### Important Notes:

- This example is simplified and ideal for understanding the basic flow in a controlled environment.
- For actual applications, this process is automated using a signaling server.
- Ensure secure methods of transferring offer/answer and ICE candidates in a real-world scenario. 

Remember, this method is primarily for learning or testing purposes and is not practical for general use due to the manual steps involved.