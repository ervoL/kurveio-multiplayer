import type { Player } from './types';

export class AudioManager {
  private crashSound: HTMLAudioElement;
  private heartSound: HTMLAudioElement;
  private heartbeatInterval: number | null = null;
  private isEnabled: boolean = true;
  private currentPeriod: number = 0;
  private currentVolume: number = 0;
  private lastHeartbeatUpdate: number = 0;

  constructor() {
    // Load audio files
    this.crashSound = new Audio('/kurveio-multiplayer/crash.wav');
    this.heartSound = new Audio('/kurveio-multiplayer/heart.wav');
    
    // Configure crash sound (reduced by 50%)
    this.crashSound.volume = 0.25;
    
    // Configure heartbeat sound
    this.heartSound.volume = 0.3;
  }

  /**
   * Play crash sound when a snake dies
   */
  playCrash(): void {
    if (!this.isEnabled) return;
    
    // Clone the audio to allow multiple simultaneous crashes
    const crash = this.crashSound.cloneNode() as HTMLAudioElement;
    crash.volume = this.crashSound.volume;
    crash.play().catch(err => console.warn('Failed to play crash sound:', err));
  }

  /**
   * Calculate the minimum distance from any alive snake to other players' trails
   * (only checks trails of OTHER players, not own trail)
   */
  private getMinDistanceToObstacle(players: Player[]): number {
    const alivePlayers = players.filter(p => p.alive);
    
    if (alivePlayers.length === 0) {
      return Infinity; // No heartbeat if no players alive
    }

    let minDistance = Infinity;

    // For each alive snake, find the closest trail point from OTHER players
    for (const alivePlayer of alivePlayers) {
      // Check distance to trails from all OTHER players
      for (const player of players) {
        // Skip own trail entirely
        if (player.id === alivePlayer.id) continue;
        
        if (player.trail.length === 0) continue;
        
        for (let i = 0; i < player.trail.length; i++) {
          const point = player.trail[i];
          
          // Skip gap points
          if (point.isGap) continue;
          
          const distance = Math.sqrt(
            Math.pow(alivePlayer.x - point.x, 2) + Math.pow(alivePlayer.y - point.y, 2)
          );
          
          minDistance = Math.min(minDistance, distance);
        }
      }
    }

    return minDistance;
  }

  /**
   * Update heartbeat based on minimum distance from any snake to nearest obstacle
   * Called every frame from the game loop
   */
  updateHeartbeat(players: Player[]): void {
    if (!this.isEnabled) return;

    const minDistance = this.getMinDistanceToObstacle(players);
    const now = Date.now();

    // Debug: Log the distance
    console.log('Min distance to obstacle:', minDistance === Infinity ? 'Infinity' : minDistance.toFixed(2));

    // Stop heartbeat if no players alive or no obstacles
    if (minDistance === Infinity) {
      this.stopHeartbeat();
      return;
    }

    // Map distance to heartbeat period (in milliseconds)
    // Close distance (50px) -> fast heartbeat (200ms)
    // Far distance (500px+) -> slow heartbeat (700ms)
    const minPeriod = 200;
    const maxPeriod = 700;
    const minDistThreshold = 50;
    const maxDistThreshold = 500;

    const normalizedDist = Math.max(0, Math.min(1, 
      (minDistance - minDistThreshold) / (maxDistThreshold - minDistThreshold)
    ));
    
    const period = minPeriod + (maxPeriod - minPeriod) * normalizedDist;

    // Map distance to volume (amplitude)
    // Close -> loud (100% = 1.0), Far -> quiet (50% = 0.5)
    // Note: HTML5 Audio volume must be between 0 and 1
    const minVolume = 0.5;
    const maxVolume = 1.0;
    const volume = Math.min(1.0, Math.max(0, maxVolume - (maxVolume - minVolume) * normalizedDist));

    // Debug: Log calculated values
    console.log('Normalized distance:', normalizedDist.toFixed(2), 'Period:', Math.round(period), 'Volume:', volume.toFixed(2));

    // Only update if:
    // 1. Heartbeat not started yet, OR
    // 2. Enough time has passed since last update (prevent constant resets), AND
    // 3. Period or volume changed significantly
    const minUpdateInterval = 500; // Don't update more often than every 500ms
    const periodThreshold = 200; // 200ms threshold for period change
    const volumeThreshold = 0.1; // 10% volume threshold
    
    const timeSinceLastUpdate = now - this.lastHeartbeatUpdate;
    const shouldUpdate = this.heartbeatInterval === null ||
      (timeSinceLastUpdate >= minUpdateInterval && (
        Math.abs(period - this.currentPeriod) > periodThreshold ||
        Math.abs(volume - this.currentVolume) > volumeThreshold
      ));
    
    if (shouldUpdate) {
      this.setHeartbeat(period, volume);
      this.lastHeartbeatUpdate = now;
    }
  }

  /**
   * Set up the heartbeat with specific period and volume
   */
  private setHeartbeat(period: number, volume: number): void {
    // Store current settings
    this.currentPeriod = period;
    this.currentVolume = volume;

    // Clear existing interval
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
    }

    // Set new heartbeat
    this.heartbeatInterval = window.setInterval(() => {
      console.log('Playing heartbeat - volume:', volume.toFixed(2), 'period:', Math.round(period) + 'ms');
      const heart = this.heartSound.cloneNode() as HTMLAudioElement;
      heart.volume = volume;
      heart.play().catch(err => console.warn('Failed to play heartbeat:', err));
    }, period);

    // Play first heartbeat immediately
    const heart = this.heartSound.cloneNode() as HTMLAudioElement;
    heart.volume = volume;
    heart.play().catch(err => console.warn('Failed to play initial heartbeat:', err));
  }

  /**
   * Stop the heartbeat sound
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      this.currentPeriod = 0;
      this.currentVolume = 0;
      this.lastHeartbeatUpdate = 0;
    }
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopHeartbeat();
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopHeartbeat();
  }
}
