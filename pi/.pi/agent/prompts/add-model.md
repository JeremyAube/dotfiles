---
description: Add an OpenCode or pi model configuration to a pi provider
argument-hint: "<provider> <configuration>"
---
Add the supplied model configuration to provider `$1` in `~/.pi/agent/models.json`.

Configuration:
${@:2}

The configuration may use OpenCode or pi (`models.json`) format.

1. Read `~/.pi/agent/models.json` and locate provider `$1`. If it does not exist, stop and explain what provider details are needed to create it.
2. Detect the input format. An OpenCode model commonly uses an ID-keyed object and fields such as `tool_call`, `temperature`, `limit.context`, `limit.output`, `modalities.input`, and `variants.*.reasoningEffort`.
3. If it is OpenCode format, convert it to this pi model format:
   - Object key becomes `id`.
   - Preserve `name` and `reasoning`.
   - Convert `modalities.input` to `input`, keeping only input types pi supports (`text`, `image`). State clearly if unsupported modalities such as `video` were omitted.
   - Convert `limit.context` to `contextWindow` and `limit.output` to `maxTokens`.
   - Convert `cost.input` and `cost.output`; explicitly set `cacheRead` and `cacheWrite` to `0` unless values were supplied.
   - Convert `variants.*.reasoningEffort` to `thinkingLevelMap`. Mark unavailable pi thinking levels as `null`; do not infer unsupported mappings.
   - Omit `tool_call` and `temperature`: pi does not use these model fields.
4. If it is already pi format, validate its fields and use it without unnecessary conversion.
5. Add or update the model by `id` in that provider's `models` array. Preserve all unrelated providers and models.
7. Report the model ID, provider, conversion details, and any omitted unsupported capabilities.
