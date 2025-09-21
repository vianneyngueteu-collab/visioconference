
        document.addEventListener('DOMContentLoaded', function() {
            // Éléments DOM
            const startBtn = document.getElementById('start');
            const receiveBtn = document.getElementById('receive');
            const offerTextarea = document.getElementById('offer');
            const incomingForm = document.getElementById('incoming');
            const emitterVideo = document.getElementById('emitter-video');
            const receiverVideo = document.getElementById('receiver-video');
            const connectionStatus = document.getElementById('connection-status');
            const copyOfferBtn = document.getElementById('copy-offer');
            const clearInputBtn = document.getElementById('clear-input');
            
            let peer = null;
            let isInitiator = false;

            // Mettre à jour le statut de connexion
            function updateStatus(message, type = 'info') {
                connectionStatus.textContent = message;
                connectionStatus.className = 'status';
                
                switch(type) {
                    case 'connected':
                        connectionStatus.classList.add('connected');
                        connectionStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
                        break;
                    case 'error':
                        connectionStatus.classList.add('error');
                        connectionStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
                        break;
                    default:
                        connectionStatus.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
                }
            }

            // Démarrer la capture vidéo
            async function startVideo() {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        video: true, 
                        audio: true 
                    });
                    emitterVideo.srcObject = stream;
                    
                    if (peer) {
                        peer.addStream(stream);
                    }
                    
                    return stream;
                } catch (err) {
                    console.error('Erreur lors de l\'accès à la caméra:', err);
                    updateStatus('Erreur: Impossible d\'accéder à la caméra/microphone', 'error');
                    return null;
                }
            }

            // Initialiser la connexion Peer
            function initPeer(initiator) {
                isInitiator = initiator;
                
                // Détruire une connexion existante
                if (peer) {
                    peer.destroy();
                }
                
                // Créer un nouveau pair
                peer = new SimplePeer({
                    initiator: initiator,
                    trickle: false
                });

                // Gérer les données de signalisation
                peer.on('signal', function(data) {
                    offerTextarea.value = JSON.stringify(data);
                    updateStatus('Données de signalisation générées. Transmettez-les à votre pair.');
                });

                // Quand la connexion est établie
                peer.on('connect', function() {
                    updateStatus('Connexion établie avec succès!', 'connected');
                });

                // Quand un flux est reçu
                peer.on('stream', function(stream) {
                    receiverVideo.srcObject = stream;
                });

                // Gérer les erreurs
                peer.on('error', function(err) {
                    console.error('Erreur WebRTC:', err);
                    updateStatus(`Erreur: ${err.message}`, 'error');
                });

                // Démarrer la vidéo si initiateur
                if (initiator) {
                    startVideo().then(stream => {
                        if (stream) {
                            peer.addStream(stream);
                        }
                    });
                }
            }

            // Événements des boutons
            startBtn.addEventListener('click', function() {
                updateStatus('Initialisation en tant qu\'initiateur...');
                initPeer(true);
            });

            receiveBtn.addEventListener('click', function() {
                updateStatus('Initialisation en tant que receveur...');
                initPeer(false);
                startVideo();
            });

            // Soumission du formulaire de signalisation
            incomingForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const textarea = this.querySelector('textarea');
                const signalData = textarea.value.trim();
                
                if (!signalData) {
                    updateStatus('Veuillez coller des données de signalisation', 'error');
                    return;
                }
                
                if (!peer) {
                    updateStatus('Veuillez d\'abord initialiser la connexion', 'error');
                    return;
                }
                
                try {
                    const data = JSON.parse(signalData);
                    peer.signal(data);
                    updateStatus('Signal traité avec succès');
                    textarea.value = '';
                } catch (err) {
                    console.error('Erreur de parsing JSON:', err);
                    updateStatus('Format de données invalide', 'error');
                }
            });

            // Copier l'offre dans le presse-papier
            copyOfferBtn.addEventListener('click', function() {
                if (!offerTextarea.value) {
                    updateStatus('Aucune donnée à copier', 'error');
                    return;
                }
                
                offerTextarea.select();
                document.execCommand('copy');
                updateStatus('Données copiées dans le presse-papier');
                
                // Feedback visuel
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-check"></i> Copié!';
                
                setTimeout(() => {
                    this.innerHTML = originalText;
                }, 2000);
            });

            // Effacer le champ de saisie
            clearInputBtn.addEventListener('click', function() {
                const textarea = incomingForm.querySelector('textarea');
                textarea.value = '';
                updateStatus('Champ effacé');
            });

            // Initialisation
            updateStatus('Prêt à établir une connexion');
        });