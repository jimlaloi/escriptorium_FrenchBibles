<template>
    <div :class="classes">
        <div class="escr-card-header">
            <h2 v-if="!compact">
                {{ context }} Ontology
            </h2>
            <h2 v-else>
                Ontology
            </h2>
            <div class="escr-card-actions">
                <SegmentedButtonGroup
                    v-if="compact"
                    color="secondary"
                    name="ontology-category"
                    :disabled="loading"
                    :options="categories"
                    :on-change-selection="onSelectCategory"
                />
            </div>
        </div>
        <SegmentedButtonGroup
            v-if="!compact"
            color="secondary"
            name="ontology-category"
            :disabled="loading"
            :options="categories"
            :on-change-selection="onSelectCategory"
        />
        <div class="escr-ontology-table-container">
            <EscrTable
                item-key="pk"
                compact
                :headers="tableHeaders"
                :items="items"
                :on-sort="onSort"
                :sort-disabled="loading"
            />
        </div>
    </div>
</template>
<script>
import EscrButton from "../Button/Button.vue";
import EscrTable from "../Table/Table.vue";
import OpenIcon from "../Icons/OpenIcon/OpenIcon.vue";
import SegmentedButtonGroup from "../SegmentedButtonGroup/SegmentedButtonGroup.vue";
import "./OntologyCard.css";

export default {
    name: "EscrOntologyCard",
    components: { EscrButton, EscrTable, OpenIcon, SegmentedButtonGroup },
    props: {
        /**
         * Whether or not to display a compact variant of this card (i.e. for document view).
         */
        compact: {
            type: Boolean,
            default: false,
        },
        /**
         * The context for the ontology card; should be Project or Document.
         */
        context: {
            type: String,
            required: true,
        },
        /**
         * A list of ontology items, each of which should have a `name` and `count` field.
         */
        items: {
            type: Array,
            default: () => [],
        },
        /**
         * The currently selected ontology category, which should be one of the four types
         * `regions`, `lines`, `text`, or `images`.
         */
        selectedCategory: {
            type: String,
            default: "regions",
            validator(value) {
                return ["regions", "lines", "text", "images"].includes(value);
            },
        },
        /**
         * Boolean indicating whether or not data is loading.
         */
        loading: {
            type: Boolean,
            default: false,
        },
        /**
         * Callback function for changing the category (regions, lines, text, images).
         */
        onSelectCategory: {
            type: Function,
            default: () => {},
        },
        /**
         * Callback function for sorting table columns.
         */
        onSort: {
            type: Function,
            default: () => {},
        },
    },
    computed: {
        /**
         * Mapping of ontology categories to label/value pairs, passing the `selected` prop to the
         * currently selected one.
         */
        categories() {
            return [
                { label: "Regions", value: "regions" },
                { label: "Lines", value: "lines" },
                { label: "Text", value: "text" },
                { label: "Images", value: "images" },
            ].map((category) => ({
                ...category,
                selected: this.selectedCategory === category.value,
            }));
        },
        /**
         * Apply the compact class if needed
         */
        classes() {
            return {
                "escr-card": true,
                "escr-card-table": true,
                "escr-ontology-card": true,
                "escr-ontology-card--compact": this.compact,
            };
        },
        /**
         * Headers for all ontology tables (type, # in project/document).
         */
        tableHeaders() {
            return [
                { label: "Type", value: "name", sortable: true },
                { label: `# in ${this.context}`, value: "count", sortable: true },
            ];
        },
    },
}
</script>
