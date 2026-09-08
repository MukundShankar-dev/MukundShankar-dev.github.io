# Replay frame provenance

These PNGs were rendered on September 8, 2026 from the existing DexVision
scripted-expert episode `level45a_v2_retry_000028`, manually accepted on that date.
They show a large cuboid being moved to the left return-bin target.

Source within the DexVision repository:
`data/demos/level4/level45a_v2_retry_d_000028_pp_block_large_return_bin_left/episode_000001`.

| Image | Action row (zero-based) | Simulation time |
| --- | ---: | ---: |
| approach.png | 0 | 0.034 s |
| lift.png | 155 | 5.304 s |
| placed.png | 310 | 10.574 s |

Rendering used MuJoCo 3.9.0, the repository's `load_replay_demo` and
`replay_loaded_demo`, 17 simulation steps per saved action, and the camera
configuration stored in the episode metadata. Images are 1200 × 800 pixels.
The full 311-action replay completed. No scene, policy, or dataset was changed.
The frames retain the scripted orientation hold and visual-only return-bin walls.
They illustrate scripted control, not learned-policy or LLM execution.

To view the same episode from a DexVision checkout with its environment active:

```bash
mjpython -m dexvision.apps.replay_demo --demo data/demos/level4/level45a_v2_retry_d_000028_pp_block_large_return_bin_left/episode_000001
```
