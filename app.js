        let p // variable globale SimplePeer

        function bindEvents() {
            p.on('error', function (err) {
                console.error('Erreur Peer:', err)
            })

            p.on('signal', function (data) {
                document.querySelector('#offer').value = JSON.stringify(data)
            })

            p.on('stream', function (stream) {
                let video = document.querySelector('#receiver-video')
                video.srcObject = stream
                video.play()
            })

            p.on('connect', function () {
                console.log("✅ Connecté au pair !")
            })

            p.on('close', function () {
                console.log("❌ Connexion fermée.")
            })
        }

        function startPeer(initiator) {
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(function (stream) {
                p = new SimplePeer({
                    initiator: initiator,
                    stream: stream,
                    trickle: false
                })

                bindEvents()

                let emitterVideo = document.querySelector('#emitter-video')
                emitterVideo.srcObject = stream
                emitterVideo.play()
            }).catch(function (err) {
                console.error("Erreur getUserMedia:", err)
                alert("Impossible d'accéder à la caméra/micro.")
            })
        }

        document.querySelector('#start').addEventListener('click', function () {
            startPeer(true)
        })

        document.querySelector('#receive').addEventListener('click', function () {
            startPeer(false)
        })

        document.querySelector('#incoming').addEventListener('submit', function (e) {
            e.preventDefault()
            if (!p) {
                alert("Aucune instance de Peer active.")
                return
            }
            let data = e.target.querySelector('textarea').value
            try {
                p.signal(JSON.parse(data))
            } catch (err) {
                console.error("❌ Signal JSON invalide:", err)
                alert("Signal invalide. Vérifie que tu as bien collé le JSON.")
            }
        })
