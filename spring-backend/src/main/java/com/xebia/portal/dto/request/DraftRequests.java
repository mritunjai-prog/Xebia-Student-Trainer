package com.xebia.portal.dto.request;

import jakarta.validation.constraints.NotNull;

public final class DraftRequests {
    private DraftRequests() {
    }

    public record SaveDraftRequest(@NotNull Object draftData) {
    }
}
