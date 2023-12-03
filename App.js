import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  TextInput,
  Pressable,
  Alert,
  StatusBar as PlatformStatusBar,
  ToastAndroid,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";

const KEY_MONTH_TOTAL_AMOUNT = "KEY_MONTH_TOTAL_AMOUNT";
const KEY_MONTH_AMOUNT_LOG = "KEY_MONTH_AMOUNT_LOG";

export default function App() {
  const [target, setTarget] = useState(50000);
  const [isEdit, setEdit] = useState(false);
  const [logs, setLogs] = useState([]);
  const [amount, setAmount] = useState("");
  const setMonthTotalAmount = async (newTotalAmount) => {
    try {
      await AsyncStorage.setItem(KEY_MONTH_TOTAL_AMOUNT, `${newTotalAmount}`);
      setTarget(Number(newTotalAmount.replace(/[^0-9]/g, "")));
    } catch (e) {
      console.error(e);
    }
  };
  const loadMonthTotalAmount = async () => {
    try {
      const value = await AsyncStorage.getItem(KEY_MONTH_TOTAL_AMOUNT);
      return value === null ? 0 : Number(value);
    } catch (e) {
      console.error(e);
    }
  };
  /**
   *
   * @param date Date
   * @param amount number
   * @return {Promise<void>}
   */
  const handleSaveLog = async (date, amount) => {
    try {
      const jsonValue = await AsyncStorage.getItem(KEY_MONTH_AMOUNT_LOG);
      const value = jsonValue !== null ? JSON.parse(jsonValue) : [];
      value.push({ date: date.toString(), amount: Number(amount) });
      value.forEach((v, i) => {
        v.id = i + 1;
      });
      await AsyncStorage.setItem(KEY_MONTH_AMOUNT_LOG, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  };
  const saveLog = async (logs) => {
    try {
      const newLogs = logs.map((log, i) => ({
        id: i + 1,
        date: log.date.toString(),
        amount: Number(log.amount),
      }));
      await AsyncStorage.setItem(KEY_MONTH_AMOUNT_LOG, JSON.stringify(newLogs));
    } catch (e) {
      console.error(e);
    }
  };
  /**
   *
   * @return {Promise<{date: Date, amount: number, id: number}[]>}
   */
  const handleLoadLogs = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(KEY_MONTH_AMOUNT_LOG);
      return (jsonValue !== null ? JSON.parse(jsonValue) : []).map((value) => ({
        date: new Date(value.date),
        amount: Number(value.amount),
        id: value.id,
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      const newLogs = logs.filter((value) => value.id !== id);
      newLogs.forEach((v, i) => {
        v.id = i + 1;
      });
      await AsyncStorage.setItem(KEY_MONTH_AMOUNT_LOG, JSON.stringify(newLogs));
      setLogs(newLogs);
    } catch (e) {
      console.error(e);
    }
  };
  const handleAddLog = async () => {
    if (!amount.replace(/[^0-9]/g, ""))
      return ToastAndroid.show("올바른 금액을 입력하세요", ToastAndroid.SHORT);
    await handleSaveLog(new Date(), Number(amount.replace(/[^0-9]/g, "")));
    setAmount("");
    setLogs(await handleLoadLogs());
  };

  const createTwoButtonAlert = (id, message) => () =>
    Alert.alert("삭제", message, [
      {
        text: "취소",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      { text: "삭제", onPress: async () => handleDeleteLog(id) },
    ]);

  const handleDeleteAllLogs = () => {
    Alert.alert("전체 삭제", `${logs.length}개 전부 삭제하겠습니까?`, [
      {
        text: "취소",
        onPress: () => console.log("Cancel Pressed"),
        style: "cancel",
      },
      {
        text: "삭제",
        onPress: async () => {
          await AsyncStorage.setItem(KEY_MONTH_AMOUNT_LOG, JSON.stringify([]));
          setLogs(await handleLoadLogs());
        },
      },
    ]);
  };

  const onChangeDate = (editDateId) => (event, selectedDate) => {
    const currentDate = selectedDate;
    const newLogs = logs
      .map((log) => {
        if (log.id === editDateId) {
          log.date = currentDate;
        }
        return log;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((log, i) => {
        log.id = i + 1;
        return log;
      });

    setLogs(newLogs);
    (async () => saveLog(newLogs))();
  };
  const handleOpenEditDate = (log) => () => {
    // setEditDateId(log.id);
    DateTimePickerAndroid.open({
      value: log.date,
      onChange: onChangeDate(log.id),
      mode: "date",
      is24Hour: true,
    });
  };

  useEffect(() => {
    (async () => {
      setLogs(await handleLoadLogs());
      setTarget(await loadMonthTotalAmount());
    })();
  }, []);

  const TOTAL_AMOUNT = logs.reduce((pv, cv) => pv + cv.amount, 0);

  const view_title_text = `${TOTAL_AMOUNT.toLocaleString()} / ${target.toLocaleString()} `;
  const view_title_sub_text = `(${
    target > 0 ? (target - TOTAL_AMOUNT).toLocaleString() : "-"
  })`;

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Pressable
          style={styles.titleContainer}
          onPress={() => setEdit(!isEdit)}
        >
          <Text style={styles.titleText}>{view_title_text}</Text>
          <Text style={styles.titleSubText}>{view_title_sub_text}</Text>
        </Pressable>
      </View>
      {isEdit ? (
        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.titleTextInput}
            placeholder={"금액 입력"}
            onChangeText={setMonthTotalAmount}
            value={`${target}`}
            numeric
            keyboardType={"numeric"}
          />
          <View style={styles.titleDeleteContainer}>
            <Pressable
              onPress={handleDeleteAllLogs}
              style={styles.titleDeleteButton}
            >
              <Text style={styles.titleDeleteText}>전체 삭제</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
      <FlatList
        data={logs}
        renderItem={({ item }) => (
          <View style={styles.listContainer}>
            <View style={styles.listDateView}>
              <Text
                style={styles.listDateText}
                onPress={handleOpenEditDate(item)}
              >{`${item.date.toLocaleDateString()}`}</Text>
            </View>
            <View style={styles.listAmountViewContainer}>
              <Text
                style={styles.item}
              >{`${item.amount.toLocaleString()}`}</Text>
            </View>
            <View>
              <Button
                color={"#f50057"}
                title={"삭제"}
                onPress={createTwoButtonAlert(
                  item.id,
                  `${item.date.toLocaleDateString()} ${item.amount.toLocaleString()}원\n삭제하겠습니까?`,
                )}
              />
            </View>
          </View>
        )}
      />
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInputStyle}
          placeholder={"금액 입력"}
          onChangeText={setAmount}
          value={amount}
          numeric
          keyboardType={"numeric"}
        />

        <View style={styles.textButtonContainer}>
          <Pressable onPress={handleAddLog} style={styles.titleDeleteButton}>
            <Text style={styles.titleDeleteText}>추가</Text>
          </Pressable>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: PlatformStatusBar.currentHeight,
  },
  titleText: {
    fontSize: 28,
    color: "#fff",
  },
  titleSubText: {
    color: "#fff",
  },
  titleTextInput: {
    backgroundColor: "#e8e8e8",
    padding: 16,
    flexGrow: 14,
    fontSize: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#4dabf5",
  },
  titleDeleteContainer: {
    flexGrow: 1,
    backgroundColor: "#f50057",
    alignItems: "center",
    height: "100%",
    display: "flex",
  },
  titleDeleteButton: {
    display: "flex",
    paddingLeft: 8,
    paddingRight: 8,
    paddingTop: 16,
  },
  titleDeleteText: {
    fontSize: 18,
    color: "#fff",
  },
  listContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    width: "85%",
    marginLeft: 12,
  },
  listDateView: {},
  listDateText: {
    fontSize: 24,
    color: "#1769aa",
  },
  listAmountViewContainer: {
    flex: 0.8,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  titleContainer: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196f3",
    justifyContent: "center",
    width: "100%",
  },
  textContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e5e5",
    justifyContent: "center",
    width: "100%",
  },
  textInputContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  textInputStyle: {
    padding: 16,
    flexGrow: 14,
    fontSize: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#4dabf5",
    backgroundColor: "#e8e8e8",
  },
  textButtonContainer: {
    flexGrow: 1,
    backgroundColor: "#1769aa",
    alignItems: "center",
    height: "100%",
    display: "flex",
  },
  item: {
    fontSize: 24,
  },
});
