import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChatListHeaderProps } from "../../../shared/Types";

export function ChatListHeader({ 
    username, 
    onBack, 
    onToggleSelection, 
    archiveFilter, 
    onFilterChange 
}: ChatListHeaderProps) {

    return (
        <View style={styles.container}>

            <View style={styles.topRow}>

                <TouchableOpacity onPress={onBack} style={styles.iconButton}>
                    <Ionicons name="arrow-back" size={22} />
                </TouchableOpacity>

                <Text style={styles.username}>
                        {username}
                </Text>

                <TouchableOpacity onPress={onToggleSelection} style={styles.iconButton}>
                    <Ionicons name="options-outline" size={22} />
                </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
                    <FilterButton 
                        label="All"
                        active={archiveFilter === "all"}
                        onPress={() => onFilterChange("all")}
                    />
                    <FilterButton 
                        label="Archive"
                        active={archiveFilter === "archived"}
                        onPress={() => onFilterChange("archived")}
                    />
                    <FilterButton 
                        label="Deleted"
                        active={archiveFilter === "deleted"}
                        onPress={() => onFilterChange("deleted")}
                    />
                    <FilterButton 
                        label="Pending"
                        active={archiveFilter === "pending"}
                        onPress={() => onFilterChange("pending")}
                    />
            </View>
        </View>
    );    
}

export function FilterButton({ label, active, onPress }: any) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.filterButton, active && styles.activeFilter]}
        >
            <Text style={[styles.filterText, active && styles.activeFilterText]}>
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
    backgroundColor: "white",
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