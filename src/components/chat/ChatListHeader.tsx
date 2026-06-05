import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../../context/ThemeContext";
import { getColors } from "../../shared/theme";
import { ChatListHeaderProps } from "../../../shared/Types";

export function ChatListHeader({
    username,
    onBack,
    onToggleSelection,
    archiveFilter,
    onFilterChange
}: ChatListHeaderProps) {
    const C = getColors(useAppTheme().theme);

    return (
        <View style={[styles.container, { backgroundColor: C.headerBg }]}>

            <View style={styles.topRow}>

                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} color={C.text} />
                </TouchableOpacity>

                <Text style={[styles.username, { color: C.text }]}>
                    {username}
                </Text>

                <TouchableOpacity onPress={onToggleSelection} style={styles.iconButton}>
                    <Ionicons name="options-outline" size={22} color={C.text} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                    <FilterButton
                        label="All"
                        active={archiveFilter === "all"}
                        onPress={() => onFilterChange("all")}
                        colors={C}
                    />
                    <FilterButton
                        label="Archive"
                        active={archiveFilter === "archived"}
                        onPress={() => onFilterChange("archived")}
                        colors={C}
                    />
                    <FilterButton
                        label="Deleted"
                        active={archiveFilter === "deleted"}
                        onPress={() => onFilterChange("deleted")}
                        colors={C}
                    />
                    <FilterButton
                        label="Pending"
                        active={archiveFilter === "pending"}
                        onPress={() => onFilterChange("pending")}
                        colors={C}
                    />
            </View>
        </View>
    );    
}

export function FilterButton({ label, active, onPress, colors }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.filterButton,
                { backgroundColor: colors?.surface ?? "#EAEAEA" },
                active && styles.activeFilter,
            ]}
        >
            <Text style={[
                styles.filterText,
                { color: colors?.text ?? "black" },
                active && styles.activeFilterText,
            ]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#D9D9D9",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  username: {
    fontSize: 18,
    fontWeight: "bold",
  },

  iconButton: {
    padding: 6,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#EAEAEA",
  },

  activeFilter: {
    backgroundColor: "#299FFF",
  },

  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "black",
  },

  activeFilterText: {
    color: "white",
  },
});