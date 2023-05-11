import {
    deleteDocument,
    editDocument,
    retrieveDocument,
    retrieveDocumentParts,
    retrieveTranscriptionCharacters,
    retrieveTranscriptionCharCount,
    retrieveTranscriptionOntology,
} from "../../../src/api";
import { tagColorToVariant } from "../util/color";

// initial state
const state = () => ({
    deleteModalOpen: false,
    editModalOpen: false,
    id: null,
    lastModified: "",
    linePosition: null,
    loading: {
        document: false,
        parts: false,
        transcriptions: false,
    },
    mainScript: "",
    menuOpen: false,
    name: "",
    /**
     * parts: [{
     *     pk: Number,
     *     thumbnail: String,
     *     order: Number,
     *     title: String,
     * }]
     */
    parts: [],
    partsCount: null,
    projectId: null,
    projectName: "",
    readDirection: "",
    /**
     * sharedWithGroups: [{
     *     pk: Number,
     *     name: String,
     * }]
     */
    sharedWithGroups: [],
    /**
     * sharedWithUsers: [{
     *     pk: Number,
     *     first_name?: String,
     *     last_name?: String,
     *     username: String,
     * }]
     */
    sharedWithUsers: [],
    shareModalOpen: false,
    /**
     * tags: [{
     *     name: String,
     *     pk: Number,
     *     variant: Number,
     * }]
     */
    tags: [],
    /**
     * transcriptions: [{
     *     name: String,
     *     pk: Number,
     *     archived: Boolean,
     *     avg_confidence?: Number,
     * }]
     */
    transcriptions: [],
});

const getters = {};

const actions = {
    /**
     * Change the ontology table category and fetch the selected ontology.
     */
    async changeOntologyCategory({ commit, dispatch }, category) {
        commit("ontology/setLoading", true, { root: true });
        commit("ontology/setCategory", category, { root: true });
        try {
            await dispatch("fetchTranscriptionOntology");
        } catch (error) {
            commit("ontology/setLoading", false, { root: true });
            dispatch("alerts/addError", error, { root: true });
        }
        commit("ontology/setLoading", false, { root: true });
    },
    /**
     * Change the selected transcription and fetch its ontology/characters.
     */
    async changeSelectedTranscription(
        { commit, dispatch, state },
        transcriptionId,
    ) {
        commit("transcription/setSelectedTranscription", transcriptionId, {
            root: true,
        });
        // update counts
        const transcription = state.transcriptions.find(
            (t) => t.pk === transcriptionId,
        );
        if (transcription) {
            const { lines_count } = transcription;
            commit("transcription/setLineCount", lines_count, { root: true });
        }
        // kickoff fetch
        try {
            commit("characters/setLoading", true, { root: true });
            commit("ontology/setLoading", true, { root: true });
            commit(
                "transcription/setLoading",
                { key: "characterCount", loading: true },
                { root: true },
            );
            await dispatch("fetchTranscriptionCharacters");
            await dispatch("fetchTranscriptionCharCount");
            await dispatch("fetchTranscriptionOntology");
        } catch (error) {
            dispatch("alerts/addError", error, { root: true });
        }
    },
    /**
     * Close the "delete document" modal.
     */
    closeDeleteModal({ commit }) {
        commit("setDeleteModalOpen", false);
    },
    /**
     * Close the "edit/delete document" menu.
     */
    closeDocumentMenu({ commit }) {
        commit("setMenuOpen", false);
    },
    /**
     * Close the "edit document" modal and clear out state.
     */
    closeEditModal({ commit, state }) {
        commit("setEditModalOpen", false);
        commit(
            "forms/setFormState",
            {
                form: "editDocument",
                formState: {
                    linePosition: state.linePosition,
                    mainScript: state.mainScript,
                    name: state.name,
                    readDirection: state.readDirection,
                    tags: state.tags.map((tag) => tag.pk),
                    tagName: "",
                },
            },
            { root: true },
        );
    },
    /**
     * Delete the current document.
     */
    async deleteDocument({ dispatch, commit, state }) {
        commit("setLoading", true);
        try {
            await deleteDocument({ documentId: state.id });
            commit("setDeleteModalOpen", false);
            // TODO: redirect to project on delete
        } catch (error) {
            dispatch("alerts/addError", error, { root: true });
        }
        commit("setLoading", false);
    },
    /**
     * Fetch the current document.
     */
    async fetchDocument({ commit, state, dispatch, rootState }) {
        commit("setLoading", "document", true);
        const { data } = await retrieveDocument(state.id);
        if (data) {
            commit("setLastModified", data.updated_at);
            commit("setMainScript", data.main_script);
            commit("setReadDirection", data.read_direction);
            commit("setLinePosition", data.line_offset);
            commit("setName", data.name);
            commit("setPartsCount", data.parts_count);
            commit("setProjectId", data.project?.id);
            commit("setProjectName", data.project?.name);
            commit("setSharedWithGroups", data.shared_with_groups);
            commit("setSharedWithUsers", data.shared_with_users);
            commit(
                "setTags",
                data.tags?.map((tag) => ({
                    ...tag,
                    variant: tagColorToVariant(tag.color),
                })),
            );
            // set form state for the edit modal
            commit(
                "forms/setFormState",
                {
                    form: "editDocument",
                    formState: {
                        linePosition: data.line_offset,
                        mainScript: data.main_script,
                        name: data.name,
                        readDirection: data.read_direction,
                        tags: state.tags.map((tag) => tag.pk),
                        tagName: "",
                    },
                },
                { root: true },
            );
            if (data.parts_count > 0) {
                // kickoff parts fetch
                try {
                    commit("setLoading", "parts", true);
                    await dispatch("fetchDocumentParts");
                } catch (error) {
                    commit("setLoading", "parts", false);
                    dispatch("alerts/addError", error, { root: true });
                }
            }
            if (data.transcriptions?.length) {
                // set transcription list to non-archived transcriptions
                const transcriptions = data.transcriptions?.filter(
                    (t) => !t.archived,
                );
                commit("setTranscriptions", transcriptions);
                // select the first one in the list if none selected already
                if (!rootState.transcription.selectedTranscription) {
                    commit(
                        "transcription/setSelectedTranscription",
                        transcriptions[0].pk,
                        { root: true },
                    );
                    const { lines_count } = transcriptions[0];
                    commit("transcription/setLineCount", lines_count, {
                        root: true,
                    });
                }
                // kick off the characters and ontology fetching
                try {
                    await dispatch("fetchTranscriptionCharacters");
                    await dispatch("fetchTranscriptionCharCount");
                    await dispatch("fetchTranscriptionOntology");
                } catch (error) {
                    dispatch("alerts/addError", error, { root: true });
                }
            }
            if (data.project?.id) {
                // set project id and fetch all document tags on the project
                try {
                    await commit("project/setId", data.project?.id, {
                        root: true,
                    });
                    await dispatch(
                        { type: "project/fetchProjectDocumentTags" },
                        { root: true },
                    );
                } catch (error) {
                    dispatch("alerts/addError", error, { root: true });
                }
            }
        } else {
            commit("setLoading", "document", false);
            throw new Error("Unable to retrieve document");
        }
        // fetch scripts
        await dispatch({ type: "project/fetchScripts" }, { root: true });
        commit("setLoading", "document", false);
    },
    async fetchDocumentParts({ commit, state }) {
        commit("setLoading", "parts", true);
        const { data } = await retrieveDocumentParts({ documentId: state.id });
        if (data?.results) {
            commit(
                "setParts",
                data.results.map((part) => ({
                    ...part,
                    thumbnail: part.image?.thumbnails?.card,
                })),
            );
        } else {
            commit("setLoading", "parts", false);
            throw new Error("Unable to retrieve document images");
        }
        commit("setLoading", "parts", false);
    },
    /**
     * Fetch the current transcription's characters, given this document's id from state,
     * plus sorting params from characters Vuex store.
     */
    async fetchTranscriptionCharacters({ commit, state, rootState }) {
        commit("characters/setLoading", true, { root: true });
        const { data } = await retrieveTranscriptionCharacters({
            documentId: state.id,
            transcriptionId: rootState.transcription.selectedTranscription,
            field: rootState.characters.sortState?.field,
            direction: rootState.characters.sortState?.direction,
        });
        if (data?.results) {
            commit("characters/setCharacters", data.results, { root: true });
        } else {
            throw new Error("Unable to retrieve characters");
        }
        commit("characters/setLoading", false, { root: true });
    },
    /**
     * Fetch the number of characters on the currently selected transcription level.
     */
    async fetchTranscriptionCharCount({ commit, state, rootState }) {
        commit(
            "transcription/setLoading",
            { key: "characterCount", loading: true },
            { root: true },
        );
        const { data } = await retrieveTranscriptionCharCount({
            documentId: state.id,
            transcriptionId: rootState.transcription.selectedTranscription,
        });
        if (data?.count) {
            commit("transcription/setCharacterCount", data.count, {
                root: true,
            });
            commit(
                "transcription/setLoading",
                { key: "characterCount", loading: false },
                { root: true },
            );
        } else {
            commit(
                "transcription/setLoading",
                { key: "characterCount", loading: false },
                { root: true },
            );
            throw new Error(
                "Unable to retrieve character count for the selected transcription.",
            );
        }
    },
    /**
     * Fetch the current transcription's ontology, given this document's id from state, plus
     * ontology category and sorting params from ontology Vuex store.
     */
    async fetchTranscriptionOntology({ commit, state, rootState }) {
        commit("ontology/setLoading", true, { root: true });
        const { data } = await retrieveTranscriptionOntology({
            documentId: state.id,
            transcriptionId: rootState.transcription.selectedTranscription,
            category: rootState.ontology.category,
            sortField: rootState.ontology.sortState?.field,
            sortDirection: rootState.ontology.sortState?.direction,
        });
        if (data?.results) {
            commit("ontology/setOntology", data.results, { root: true });
            commit("ontology/setLoading", false, { root: true });
        } else {
            commit("ontology/setLoading", false, { root: true });
            throw new Error(
                `Unable to retrieve ${rootState.ontology.category} ontology`,
            );
        }
    },
    /**
     * Open the "delete document" modal.
     */
    openDeleteModal({ commit }) {
        commit("setDeleteModalOpen", true);
    },
    /**
     * Open the "edit/delete document" menu.
     */
    openDocumentMenu({ commit }) {
        commit("setMenuOpen", true);
    },
    /**
     * Open the "edit document" modal.
     */
    openEditModal({ commit }) {
        commit("setEditModalOpen", true);
    },
    /**
     * Save changes to the document made in the edit modal.
     */
    async saveDocument({ commit, dispatch, rootState, state }) {
        commit("setLoading", "document", true);
        const {
            linePosition,
            mainScript,
            name,
            readDirection,
            tags,
        } = rootState.forms.editDocument;
        try {
            const { data } = await editDocument(state.id, {
                linePosition,
                mainScript,
                name,
                readDirection,
                tags,
            });
            if (data) {
                commit("setName", name);
                commit("setLinePosition", linePosition);
                commit("setMainScript", mainScript);
                commit("setReadDirection", readDirection);
                commit(
                    "setTags",
                    rootState.project.documentTags.filter((t) =>
                        data?.tags?.includes(t.pk),
                    ),
                );
                commit("setEditModalOpen", false);
            } else {
                throw new Error("Unable to save document");
            }
            // show toast alert on success
            dispatch(
                "alerts/add",
                {
                    color: "success",
                    message: "Document updated successfully",
                },
                { root: true },
            );
        } catch (error) {
            commit("setLoading", "document", false);
            dispatch("alerts/addError", error, { root: true });
        }
        commit("setLoading", "document", false);
    },
    /**
     * Set the ID of the document on the state (happens immediately on page load).
     */
    setId({ commit }, id) {
        commit("setId", id);
    },
    /**
     * Set the loading state.
     */
    setLoading({ commit }, key, loading) {
        commit("setLoading", key, loading);
    },
    /**
     * Change the characters sort field and perform another fetch for characters.
     */
    async sortCharacters({ commit, dispatch }, field) {
        let direction = 1;
        if (field === "frequency") {
            direction = -1;
        }
        commit("characters/setSortState", { field, direction }, { root: true });
        try {
            await dispatch("fetchTranscriptionCharacters");
        } catch (error) {
            commit("characters/setLoading", false, { root: true });
            dispatch("alerts/addError", error, { root: true });
        }
    },
    /**
     * Event handler for sorting the ontology table; sets the sort state on the
     * ontology Vuex store, then makes a call to fetch ontology based on current state.
     */
    async sortOntology({ commit, dispatch }, { field, direction }) {
        commit("ontology/setSortState", { field, direction }, { root: true });
        try {
            await dispatch("fetchTranscriptionOntology");
        } catch (error) {
            commit("ontology/setLoading", false, { root: true });
            dispatch("alerts/addError", error, { root: true });
        }
    },
};

const mutations = {
    setDeleteModalOpen(state, open) {
        state.deleteModalOpen = open;
    },
    setEditModalOpen(state, open) {
        state.editModalOpen = open;
    },
    setId(state, id) {
        state.id = id;
    },
    setLastModified(state, lastModified) {
        state.lastModified = lastModified;
    },
    setLinePosition(state, linePosition) {
        state.linePosition = linePosition;
    },
    setLoading(state, key, loading) {
        state.loading[key] = loading;
    },
    setMainScript(state, mainScript) {
        state.mainScript = mainScript;
    },
    setMenuOpen(state, open) {
        state.menuOpen = open;
    },
    setName(state, name) {
        state.name = name;
    },
    setParts(state, parts) {
        state.parts = parts;
    },
    setPartsCount(state, partsCount) {
        state.partsCount = partsCount;
    },
    setProjectId(state, projectId) {
        state.projectId = projectId;
    },
    setProjectName(state, projectName) {
        state.projectName = projectName;
    },
    setReadDirection(state, readDirection) {
        state.readDirection = readDirection;
    },
    setSharedWithGroups(state, groups) {
        state.sharedWithGroups = groups;
    },
    setSharedWithUsers(state, users) {
        state.sharedWithUsers = users;
    },
    setShareModalOpen(state, open) {
        state.shareModalOpen = open;
    },
    setTags(state, tags) {
        state.tags = tags;
    },
    setTranscriptions(state, transcriptions) {
        state.transcriptions = transcriptions;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    actions,
    mutations,
};
