import {SafeAreaView, Text, StyleSheet} from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center"
    },
    heading: {
        fontSize: 20,
        color: "black",
    }
})
export default function catalog() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.heading}>Catalog</Text>
        </SafeAreaView>
    )
}